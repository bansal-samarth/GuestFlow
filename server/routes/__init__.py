from flask import Blueprint

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/api')
visitor_bp = Blueprint('visitor', __name__, url_prefix='/api')
dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')

# Import routes after blueprints are defined
from .auth_routes import *
from .visitor_routes import *
from .dashboard_routes import *