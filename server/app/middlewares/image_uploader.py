import cloudinary.uploader
from flask import jsonify
from app.utils.response_util import generate_response

MAX_IMAGES = 3
MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def validate_and_upload_images(signature, files):
    if len(files) > MAX_IMAGES:
        return None, jsonify(generate_response(
            signature,
            "create_project_update",
            "fail",
            error=f"Maximum {MAX_IMAGES} attachments allowed"
        )), 400

    image_urls = []

    for file in files:
        if not allowed_file(file.filename):
            return None, jsonify(generate_response(
                signature,
                "create_project_update",
                "fail",
                error="Invalid file type. Only png, jpg, jpeg, gif are allowed"
            )), 400

        # Check file size
        file.seek(0, 2)  # Move to end of file
        file_length = file.tell()
        file.seek(0)     # Reset pointer to beginning

        if file_length > MAX_IMAGE_SIZE:
            return None, jsonify(generate_response(
                signature,
                "create_project_update",
                "fail",
                error="Each image must be less than 2MB"
            )), 400

        # Upload to Cloudinary
        try:
            upload_result = cloudinary.uploader.upload(file)
            image_urls.append(upload_result.get("secure_url"))
        except Exception as e:
            return None, jsonify(generate_response(
                signature,
                "create_project_update",
                "fail",
                error=f"Failed to upload image: {str(e)}"
            )), 500

    return image_urls, None, None
