from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from datetime import timedelta
import os

from config import config
from models import db, User
from routes import auth_bp, visitor_bp, dashboard_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    # app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB limit

    # Set JWT access token expiration to 1 hour
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    
    # Initialize extensions
    CORS(app, supports_credentials=True, origins=["*"], allow_headers=["Content-Type", "Authorization"])
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(visitor_bp)
    app.register_blueprint(dashboard_bp)
    
    # Initialize database
    with app.app_context():
        db.create_all()
        initialize_database()
    
    @app.route('/')
    def home():
        return "Visitor Management System API"
    
    return app

def initialize_database():
    # Create admin user if it doesn't exist
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@example.com',
            password=generate_password_hash('admin123'),  # Change this in production
            department='Administration',
            role='admin'
        )
        db.session.add(admin)
        db.session.commit()

if __name__ == '__main__':
    app = create_app('development')
    app.run(debug=True)