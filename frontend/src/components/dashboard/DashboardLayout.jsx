// src/components/dashboard/DashboardLayout.jsx
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { 
  FaHome, FaUsers, FaUserCheck, FaUserPlus, FaIdBadge ,FaUserClock ,FaUserCog 
} from 'react-icons/fa';
import Logo from '../common/Logo';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FaHome className="w-5 h-5" /> },
    { path: '/dashboard/visitors', name: 'View Visitors', icon: <FaUsers className="w-5 h-5" /> },
    { path: '/dashboard/visitors/new', name: 'Add Visitor', icon: <FaUserPlus className="w-5 h-5" /> },
    { path: '/dashboard/visitors/pre-approvals', name: 'Pre-Approvals', icon: <FaIdBadge className="w-5 h-5" /> },
    { path: '/dashboard/visitors/pending', name: 'Pending', icon: <FaUserClock className="w-5 h-5" /> },
    { path: '/dashboard/visitors/check-in', name: 'Check In', icon: <FaUserCheck className="w-5 h-5" /> },
    ...(user?.role === 'admin' ? [
      { path: '/dashboard/users', name: 'Users', icon: <FaUserCog className="w-5 h-5" /> }
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-emerald-600 text-white rounded-lg"
      >
        {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl transform transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 border-b border-emerald-100">
          <Logo />
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center p-3 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.icon}
              <span className="ml-3 font-medium">{item.name}</span>
            </Link>
          ))}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="ml-3 font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;