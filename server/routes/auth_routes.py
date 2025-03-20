from flask import request, jsonify
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from . import auth_bp
from models import db, User

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 400
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        department=data.get('department', ''),
        role=data.get('role', 'employee')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 200

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    
    if user and check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Only admins can see all users
    if current_user.role != 'admin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    users = User.query.all()
    return jsonify({'users': [user.to_dict() for user in users]})