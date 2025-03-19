import os

class Config:
    # Base configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///vms.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'your-secret-key'  # Change this in production
    UPLOAD_FOLDER = 'visitor_photos'

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # In production, you might want to use a different database
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    # JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')

# Choose configuration based on environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}