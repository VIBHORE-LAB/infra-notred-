import argparse
import json
import os
import random
import sys
import time
import urllib.parse
import urllib.request
from typing import Any, Dict, List

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv


WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
POLLINATIONS_API = "https://image.pollinations.ai/prompt/"
PEXELS_API = "https://api.pexels.com/v1/search"


def configure_cloudinary() -> None:
    load_dotenv()
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    missing = [k for k, v in {
        "CLOUDINARY_CLOUD_NAME": cloud_name,
        "CLOUDINARY_API_KEY": api_key,
        "CLOUDINARY_API_SECRET": api_secret,
    }.items() if not v]

    if missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(missing)}")

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
    )


def fetch_json(url: str, timeout: int = 20) -> Dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": "infra-notred-image-seeder/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _wikimedia_search(search_query: str, limit: int) -> List[str]:
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": 6,
        "gsrsearch": f"{search_query} filetype:bitmap",
        "gsrlimit": max(20, min(limit * 5, 50)),
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
    }
    url = f"{WIKIMEDIA_API}?{urllib.parse.urlencode(params)}"
    data = fetch_json(url)
    pages = data.get("query", {}).get("pages", {})

    urls: List[str] = []
    for page in pages.values():
        image_info = (page.get("imageinfo") or [{}])[0]
        image_url = image_info.get("url")
        mime = (image_info.get("mime") or "").lower()
        width = image_info.get("width", 0)
        height = image_info.get("height", 0)

        if not image_url:
            continue
        if mime not in {"image/jpeg", "image/png", "image/webp"}:
            continue
        # Keep quality reasonable but avoid over-filtering sparse result sets.
        if width and height and (width < 600 or height < 400):
            continue
        urls.append(image_url)

    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            deduped.append(u)

    return deduped


def get_wikimedia_image_urls(query: str, limit: int) -> List[str]:
    # Try multiple related searches because Commons search can be sparse/noisy
    candidate_queries = [
        query,
        "construction site",
        "road construction machinery",
        "bridge construction",
        "infrastructure construction",
    ]

    all_urls: List[str] = []
    seen = set()

    for q in candidate_queries:
        try:
            batch = _wikimedia_search(q, limit)
        except Exception:
            batch = []
        for u in batch:
            if u not in seen:
                seen.add(u)
                all_urls.append(u)
            if len(all_urls) >= limit:
                return all_urls[:limit]

    return all_urls[:limit]


def get_ai_image_urls(prompt: str, limit: int) -> List[str]:
    urls = []
    for i in range(limit):
        seed = random.randint(1, 9999999)
        prompt_text = urllib.parse.quote(f"{prompt}, documentary construction photography")
        urls.append(f"{POLLINATIONS_API}{prompt_text}?width=1400&height=900&seed={seed}")
        if i < limit - 1:
            time.sleep(0.1)
    return urls


def get_pexels_image_urls(query: str, limit: int) -> List[str]:
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        raise RuntimeError("PEXELS_API_KEY is required for --source pexels")

    params = urllib.parse.urlencode({
        "query": query,
        "orientation": "landscape",
        "per_page": max(20, min(limit * 3, 80)),
        "page": 1,
    })
    req = urllib.request.Request(
        f"{PEXELS_API}?{params}",
        headers={
            "Authorization": api_key,
            "User-Agent": "infra-notred-image-seeder/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    photos = data.get("photos", [])
    urls: List[str] = []
    for p in photos:
        src = p.get("src") or {}
        image_url = src.get("large2x") or src.get("original")
        if image_url:
            urls.append(image_url)
    return urls[:limit]


def upload_urls_to_cloudinary(
    urls: List[str],
    folder: str,
    tags: List[str],
    project_name: str,
) -> List[Dict[str, Any]]:
    uploaded = []

    for idx, image_url in enumerate(urls, 1):
        try:
            result = cloudinary.uploader.upload(
                image_url,
                folder=folder,
                resource_type="image",
                tags=tags,
                context={"project": project_name, "source_url": image_url},
                overwrite=False,
            )
            uploaded.append(
                {
                    "source_url": image_url,
                    "public_id": result.get("public_id"),
                    "secure_url": result.get("secure_url"),
                    "width": result.get("width"),
                    "height": result.get("height"),
                    "format": result.get("format"),
                }
            )
            print(f"[{idx}/{len(urls)}] Uploaded: {result.get('secure_url')}")
        except Exception as exc:
            print(f"[{idx}/{len(urls)}] Failed for {image_url} -> {exc}", file=sys.stderr)

    return uploaded


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch real/AI construction images and upload them to Cloudinary."
    )
    parser.add_argument(
        "--source",
        choices=["wikimedia", "pexels", "mixed", "ai"],
        default="wikimedia",
        help=(
            "Image source. 'wikimedia' = real images from Wikimedia Commons. "
            "'pexels' = real stock photos (needs PEXELS_API_KEY). "
            "'mixed' = combines Wikimedia + Pexels. 'ai' = generated images."
        ),
    )
    parser.add_argument(
        "--query",
        default="construction site heavy machinery urban infrastructure",
        help="Search query/prompt for image generation.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=10,
        help="How many images to upload.",
    )
    parser.add_argument(
        "--project",
        default="project",
        help="Project name used in Cloudinary context metadata.",
    )
    parser.add_argument(
        "--folder",
        default="infra-notred/projects",
        help="Cloudinary folder to upload into.",
    )
    parser.add_argument(
        "--output",
        default="",
        help="Optional JSON file path to save uploaded URLs/metadata.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.count < 1:
        raise ValueError("--count must be >= 1")

    configure_cloudinary()
    tags = ["construction", "infrastructure", args.source]

    if args.source == "wikimedia":
        source_urls = get_wikimedia_image_urls(args.query, args.count)
        if not source_urls:
            raise RuntimeError(
                "No Wikimedia images found for query. Try a broader --query or use --source ai."
            )
    elif args.source == "pexels":
        source_urls = get_pexels_image_urls(args.query, args.count)
        if not source_urls:
            raise RuntimeError("No Pexels images found. Try another --query.")
    elif args.source == "mixed":
        half = max(1, args.count // 2)
        wikimedia_urls = get_wikimedia_image_urls(args.query, half)
        pexels_urls = get_pexels_image_urls(args.query, args.count - len(wikimedia_urls))
        source_urls = (wikimedia_urls + pexels_urls)[: args.count]
        if not source_urls:
            raise RuntimeError("No mixed-source images found. Try another --query.")
    else:
        source_urls = get_ai_image_urls(args.query, args.count)

    uploaded = upload_urls_to_cloudinary(
        source_urls,
        folder=args.folder,
        tags=tags,
        project_name=args.project,
    )

    if not uploaded:
        raise RuntimeError("No images were uploaded successfully.")

    print("\nUpload complete.")
    print(f"Requested: {args.count}")
    print(f"Uploaded: {len(uploaded)}")

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(uploaded, f, indent=2)
        print(f"Saved metadata to: {args.output}")
    else:
        print(json.dumps(uploaded, indent=2))


if __name__ == "__main__":
    main()
