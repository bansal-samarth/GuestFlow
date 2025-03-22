import os
import uuid
import base64
import boto3
from botocore.exceptions import NoCredentialsError
import qrcode
import io

# Hardcoded values for bucket name and region
S3_BUCKET = "samarth6969"   # Replace with your bucket name
AWS_REGION = "us-east-1"    # e.g., "us-east-1"

def save_photo(photo_data):
    """
    Save base64 encoded photo to public S3 bucket and return the S3 URL.
    """
    try:
        # Remove the base64 prefix if present
        if 'base64,' in photo_data:
            photo_data = photo_data.split('base64,')[1]
        
        # Decode the base64 string
        photo_bytes = base64.b64decode(photo_data)
        
        # Generate a unique filename
        filename = f"{uuid.uuid4()}.jpg"
        
        # Create S3 client with credentials from environment variables
        s3_client = boto3.client(
            's3',
            region_name=AWS_REGION,
        )
        
        # Create in-memory file-like object
        file_obj = io.BytesIO(photo_bytes)
        
        # Define S3 key for the file
        s3_key = filename
        
        # Upload to S3
        s3_client.upload_fileobj(
            file_obj, 
            S3_BUCKET,
            s3_key, 
            ExtraArgs={
                'ContentType': 'image/jpeg',
                'ACL': 'public-read'  # Make the file publicly accessible
            }
        )
        
        # Generate the URL for the uploaded file
        s3_url = f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        return s3_url
        
    except Exception as e:
        print(f"Error saving photo to S3: {e}")
        return None

def generate_badge_id(prefix="VIS"):
    """Generate a unique badge ID"""
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def generate_qr_code(data):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save the image to a BytesIO stream
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    
    # Encode image to base64 string
    qr_code_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{qr_code_base64}"