import boto3
import os
import uuid
from werkzeug.utils import secure_filename

AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION")

s3_client = boto3.client('s3',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=AWS_REGION
)

def upload_to_s3(file, folder="progress_reports"):
    if not file:
        return None
    
    filename = secure_filename(file.filename)
    unique_filename = f"{folder}/{uuid.uuid4()}_{filename}"
    
    try:
        s3_client.upload_fileobj(
            file,
            AWS_S3_BUCKET,
            unique_filename,
            ExtraArgs={
                "ContentType": file.content_type,
                "ACL": "public-read"
            }
        )
        # return the public URL
        return f"https://{AWS_S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None
