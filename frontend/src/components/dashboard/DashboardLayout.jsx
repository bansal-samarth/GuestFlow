// src/components/dashboard/DashboardLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { 
  FaHome, FaUsers, FaUserCheck, FaUserPlus, FaIdBadge, FaUserClock, FaUserCog 
} from 'react-icons/fa';
import { RiUserSharedFill } from "react-icons/ri";
import Logo from '../common/Logo';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: <FaHome className="w-5 h-5" /> },
    { path: '/dashboard/visitors', name: 'View Visitors', icon: <FaUsers className="w-5 h-5" /> },
    { path: '/dashboard/visitors/new', name: 'Add Visitor', icon: <FaUserPlus className="w-5 h-5" /> },
    { path: '/dashboard/visitors/pending', name: 'Pending', icon: <FaUserClock className="w-5 h-5" /> },
    { path: '/dashboard/visitors/check-in', name: 'Check In', icon: <FaUserCheck className="w-5 h-5" /> },
    { path: '/dashboard/visitors/check-out', name: 'Check Out', icon: <RiUserSharedFill className="w-5 h-5" /> },
  ];

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-full shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 ${isCollapsed ? 'w-20' : 'w-72'} bg-white shadow-xl transform transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className={`flex items-center justify-between p-4 border-b border-emerald-100 ${isCollapsed ? 'flex-col' : ''}`}>
          <div className={`${isCollapsed ? 'w-full flex justify-center' : ''}`}>
            <Logo />
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center p-2 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex flex-col justify-between h-[calc(100%-70px)]">
          <nav className="p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-xl transition-all ${
                  isActive(item.path) 
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white font-medium shadow-md' 
                    : 'text-emerald-700 hover:bg-emerald-50'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <div className={`${isCollapsed ? 'w-6 h-6 flex items-center justify-center' : ''}`}>
                  {item.icon}
                </div>
                {!isCollapsed && <span className="ml-3 font-medium whitespace-nowrap">{item.name}</span>}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 mt-auto">
            <div className={`flex items-center p-3 mb-4 rounded-xl bg-emerald-50 ${isCollapsed ? 'justify-center' : ''}`}>
              {!isCollapsed && (
                <div className="flex-1">
                  <p className="font-medium text-emerald-800">{user?.name || 'User'}</p>
                  <p className="text-xs text-emerald-600">{user?.role || 'role'}</p>
                </div>
              )}
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-white font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className={`w-full flex items-center p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            >
              <FiLogOut className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3 font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isCollapsed ? 'md:ml-20' : 'md:ml-72'} min-h-screen`}>
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

// Missing FiChevronLeft component definition
const FiChevronLeft = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );
};

export default DashboardLayout;