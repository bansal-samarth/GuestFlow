from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import and_, desc

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
    
    # Get basic counts
    total_visitors = base_query.count()
    today_visitors = base_query.filter(
        Visitor.check_in_time >= today_start,
        Visitor.check_in_time < today_end
    ).count()
    
    checked_in = base_query.filter_by(status='checked_in').count()
    pending = base_query.filter_by(status='pending').count()
    
    # Get status distribution
    status_distribution = {status: base_query.filter_by(status=status).count() for status in 
                           ['pending', 'approved', 'rejected', 'checked_in', 'checked_out']}
    
    # Get hourly expected visitors (based on approval windows for today)
    hourly_expected = {}
    for hour in range(24):
        hour_start = today_start + timedelta(hours=hour)
        hour_end = hour_start + timedelta(hours=1)
        
        expected_count = base_query.filter(
            and_(
                Visitor.approval_window_start <= hour_end,
                Visitor.approval_window_end >= hour_start,
                Visitor.status.in_(['approved', 'checked_in']),
            )
        ).count()
        
        hourly_expected[f"{hour:02d}:00"] = expected_count
    
    # Get daily visitor trend for the past week
    daily_trend = {}
    for days_ago in range(7):
        date = today - timedelta(days=days_ago)
        date_start = datetime.combine(date, datetime.min.time())
        date_end = date_start + timedelta(days=1)
        
        count = base_query.filter(
            Visitor.check_in_time >= date_start,
            Visitor.check_in_time < date_end
        ).count()
        
        daily_trend[date.strftime('%Y-%m-%d')] = count
    
    # Calculate average visit duration for checked-out visitors
    visit_durations = [
        (visitor.check_out_time - visitor.check_in_time).total_seconds() / 60  # in minutes
        for visitor in base_query.filter(
            Visitor.status == 'checked_out',
            Visitor.check_in_time.isnot(None),
            Visitor.check_out_time.isnot(None)
        ).all()
    ]
    
    avg_visit_duration = sum(visit_durations) / len(visit_durations) if visit_durations else 0
    
    # Get pre-approved visitor count
    pre_approved_count = base_query.filter_by(pre_approved=True).count()
    
    # Get visitors without photos
    no_photo_count = base_query.filter(Visitor.photo_path.is_(None)).count()
    
    # Get recent checked-out visitors
    # Get recent checked-out visitors
    now = datetime.now()
    recent_checked_out = base_query.filter_by(status='checked_out').order_by(desc(Visitor.check_out_time)).limit(5).all()
    recent_visitors = []

    for visitor in recent_checked_out:
        if visitor.check_out_time:
            ago = now - visitor.check_out_time
            ago_minutes = ago.total_seconds() // 60
            ago_str = f"{int(ago_minutes // 60)}h {int(ago_minutes % 60)}m ago" if ago_minutes >= 60 else f"{int(ago_minutes)}m ago"
        else:
            ago_str = "N/A"  # Handle cases where check_out_time is missing
        
        recent_visitors.append({
            'id': visitor.id,
            'full_name': visitor.full_name,
            'status': visitor.status,
            'ago': ago_str
        })

    
    return jsonify({
        # Basic stats
        'total_visitors': total_visitors,
        'today_visitors': today_visitors,
        'checked_in': checked_in,
        'pending': pending,
        
        # Enhanced stats
        'status_distribution': status_distribution,
        'hourly_expected': hourly_expected,
        'daily_trend': daily_trend,
        'avg_visit_duration': round(avg_visit_duration, 1),
        'pre_approved_count': pre_approved_count,
        'no_photo_count': no_photo_count,
        'recent_checked_out': recent_visitors
    })
