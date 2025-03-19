import os
import uuid
import base64
from flask import current_app

import qrcode
import io
import base64

def save_photo(photo_data):
    """Save base64 encoded photo and return the file path"""
    try:
        # Remove the base64 prefix if present
        if 'base64,' in photo_data:
            photo_data = photo_data.split('base64,')[1]
        
        # Decode the base64 string
        photo_bytes = base64.b64decode(photo_data)
        
        # Generate a unique filename
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        
        # Save the photo
        with open(filepath, 'wb') as f:
            f.write(photo_bytes)
        
        return filepath
    except Exception as e:
        print(f"Error saving photo: {e}")
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
