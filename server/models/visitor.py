from . import db
from datetime import datetime

class Visitor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    company = db.Column(db.String(100))
    purpose = db.Column(db.String(200))
    host_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    photo_path = db.Column(db.String(255))
    badge_id = db.Column(db.String(50), unique=True)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, checked_in, checked_out
    check_in_time = db.Column(db.DateTime)
    check_out_time = db.Column(db.DateTime)
    pre_approved = db.Column(db.Boolean, default=False)
    approval_window_start = db.Column(db.DateTime)
    approval_window_end = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'company': self.company,
            'purpose': self.purpose,
            'host_id': self.host_id,
            'badge_id': self.badge_id,
            'status': self.status,
            'check_in_time': self.check_in_time.isoformat() if self.check_in_time else None,
            'check_out_time': self.check_out_time.isoformat() if self.check_out_time else None,
            'pre_approved': self.pre_approved,
            'approval_window_start': self.approval_window_start.isoformat() if self.approval_window_start else None,
            'approval_window_end': self.approval_window_end.isoformat() if self.approval_window_end else None,
            'photo_path': self.photo_path  # Ensure photo_path is included
        }
