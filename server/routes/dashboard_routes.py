from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

from . import dashboard_bp
from models import User, Visitor

@dashboard_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    # Calculate today's date range
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today + timedelta(days=1), datetime.min.time())
    
    # Base query depending on user role
    if current_user.role in ['admin', 'security']:
        base_query = Visitor.query
    else:
        base_query = Visitor.query.filter_by(host_id=current_user_id)
    
    # Get counts
    total_visitors = base_query.count()
    today_visitors = base_query.filter(
        Visitor.check_in_time >= today_start,
        Visitor.check_in_time < today_end
    ).count()
    
    checked_in = base_query.filter_by(status='checked_in').count()
    pending = base_query.filter_by(status='pending').count()
    
    return jsonify({
        'total_visitors': total_visitors,
        'today_visitors': today_visitors,
        'checked_in': checked_in,
        'pending': pending
    })