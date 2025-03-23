import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiFilter, FiEye, FiChevronDown, FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import Pagination from '../common/Pagination';

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ 
    status: 'all',
    sort: 'newest'
  });
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageErrors, setImageErrors] = useState({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await axios.get('/api/visitors', {
          params: {
            search: searchTerm,
            status: filters.status,
            sort: filters.sort,
            page: currentPage,
            limit: itemsPerPage
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setVisitors(response.data.visitors);
      } catch (error) {
        toast.error('Failed to fetch visitors');
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, [searchTerm, filters, currentPage]);

  const filteredVisitors = visitors.filter(visitor => {
    const searchMatches = 
      visitor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.id.toString().includes(searchTerm) ||
      visitor.badge_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const statusMatches = filters.status === 'all' || visitor.status === filters.status;
    
    return searchMatches && statusMatches;
  });

  // Handle image loading errors
  const handleImageError = (visitorId) => {
    setImageErrors(prev => ({
      ...prev,
      [visitorId]: true
    }));
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      checked_in: { bg: 'bg-teal-100', text: 'text-emerald-800', label: 'Checked In' },
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Pending' }, // This looks good
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' }, // Changed from text-teal-800 to text-blue-800
      checked_out: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Checked Out' }, // Changed from bg-emerald-100/text-gray-700
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' } // This looks good
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status.replace('_', ' ') };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Visitor Avatar component to handle both S3 images and fallbacks
  const VisitorAvatar = ({ visitor, size = 'medium' }) => {
    const hasImageError = imageErrors[visitor.id];
    const sizeClass = size === 'large' ? 'h-16 w-16' : 'h-12 w-12';
    const textSizeClass = size === 'large' ? 'text-xl' : 'text-lg';
    
    if (visitor.photo_path && !hasImageError) {
      return (
        <img
          src={visitor.photo_path}
          alt={visitor.full_name}
          className={`${sizeClass} rounded-full object-cover border-2 border-emerald-50 shadow-sm`}
          onError={() => handleImageError(visitor.id)}
        />
      );
    } else {
      // Create a gradient based on the first letter for more visual variety
      const letter = visitor.full_name.charAt(0).toUpperCase();
      const hue = (letter.charCodeAt(0) - 65) * 15 % 360; // Map A-Z to different hues
      
      return (
        <div 
          className={`${sizeClass} rounded-full flex items-center justify-center shadow-sm`}
          style={{ background: `linear-gradient(135deg, hsl(${hue}, 70%, 90%), hsl(${hue}, 70%, 80%))` }}
        >
          <span className={`text-emerald-800 font-semibold ${textSizeClass}`}>
            {letter}
          </span>
        </div>
      );
    }
  };

  const VisitorModal = ({ visitor, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl p-0 max-w-3xl w-full overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-white">Visitor Details</h2>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mt-6 flex items-center gap-4">
            <div className="p-1 bg-white/10 rounded-full">
              <VisitorAvatar visitor={visitor} size="large" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{visitor.full_name}</h3>
              <div className="flex gap-3 mt-1 text-white/80">
                <span className="flex items-center gap-1">
                  <FiUser className="h-4 w-4" />
                  ID: {visitor.id}
                </span>
                {visitor.badge_id && (
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    Badge: {visitor.badge_id}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <StatusBadge status={visitor.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div>
              <h4 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Contact Information
              </h4>
              
              <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Email Address</p>
                    <p className="text-emerald-900">{visitor.email || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-100 rounded-full p-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Phone Number</p>
                    <p className="text-emerald-900">{visitor.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-emerald-800 mt-6 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Purpose of Visit
              </h4>
              
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-emerald-900">{visitor.purpose || 'Not specified'}</p>
                <p className="mt-2"><span className="text-sm text-emerald-700 font-medium">Host ID:</span> {visitor.host_id}</p>
              </div>
            </div>

            {/* Visit Details */}
            <div>
              <h4 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <FiClock className="h-5 w-5 text-emerald-600" />
                Visit Timeline
              </h4>
              
              <div className="bg-gradient-to-b from-teal-50 to-emerald-50 rounded-xl p-4 space-y-4">
                <div className="relative pl-8 pb-4 border-l-2 border-emerald-200">
                  <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-500"></div>
                  <p className="font-medium text-emerald-800">Check-in</p>
                  <p className="text-emerald-700">
                    {visitor.check_in_time ? 
                      format(parseISO(visitor.check_in_time), 'MMM dd, yyyy HH:mm') : 'Not checked in yet'}
                  </p>
                </div>
                
                <div className="relative pl-8">
                  <div className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full ${visitor.check_out_time ? 'bg-emerald-500' : 'bg-emerald-200'}`}></div>
                  <p className="font-medium text-emerald-800">Check-out</p>
                  <p className="text-emerald-700">
                    {visitor.check_out_time ? 
                      format(parseISO(visitor.check_out_time), 'MMM dd, yyyy HH:mm') : 'Not checked out yet'}
                  </p>
                </div>
              </div>

              {visitor.pre_approved && (
                <>
                  <h4 className="text-lg font-semibold text-emerald-800 mt-6 mb-4 flex items-center gap-2">
                    <FiCalendar className="h-5 w-5 text-emerald-600" />
                    Pre-approval Window
                  </h4>
                  
                  <div className="bg-teal-50 rounded-xl p-4">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-sm text-teal-700 font-medium">Start Time</p>
                        <p className="text-teal-900">{format(parseISO(visitor.approval_window_start), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-teal-700 font-medium">End Time</p>
                        <p className="text-teal-900">{format(parseISO(visitor.approval_window_end), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const VisitorCard = ({ visitor }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-emerald-100 hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <VisitorAvatar visitor={visitor} />
          <div>
            <p className="font-medium text-emerald-800">{visitor.full_name}</p>
            <div className="text-sm text-emerald-600">
              <p>ID: {visitor.id}</p>
              {visitor.badge_id && <p>Badge: {visitor.badge_id}</p>}
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <StatusBadge status={visitor.status} />
          <button 
            onClick={() => setSelectedVisitor(visitor)}
            className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <FiEye className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-3 text-sm text-gray-500">
          {visitor.check_in_time ? (
            <div className="flex items-center gap-1">
              <FiClock className="w-4 h-4" />
              {format(parseISO(visitor.check_in_time), 'MMM dd, yyyy HH:mm')}
            </div>
          ) : 'Not checked in'}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-t-2 border-l-2 border-emerald-300 animate-spin"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-b from-emerald-50/50 to-white min-h-screen">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 rounded-xl shadow-md">
        <div className="px-6 py-5">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Visitor Management
          </h1>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FiSearch className="absolute left-3 top-3 text-emerald-500" />
            <input
              type="text"
              placeholder="Search by name, ID or badge..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-emerald-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative md:w-48">
            <button 
              className="w-full flex items-center justify-between px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-emerald-700"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span className="flex items-center gap-2">
                <FiFilter className="text-emerald-600" />
                {filters.status === 'all' ? 'All Statuses' : filters.status.replace('_', ' ')}
              </span>
              <FiChevronDown className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-emerald-100 py-1 animate-fadeIn">
                <button 
                  className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${filters.status === 'all' ? 'bg-emerald-100 text-emerald-800' : ''}`}
                  onClick={() => {
                    setFilters({...filters, status: 'all'});
                    setIsFilterOpen(false);
                  }}
                >
                  All Statuses
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${filters.status === 'pending' ? 'bg-emerald-100 text-emerald-800' : ''}`}
                  onClick={() => {
                    setFilters({...filters, status: 'pending'});
                    setIsFilterOpen(false);
                  }}
                >
                  Pending
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${filters.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : ''}`}
                  onClick={() => {
                    setFilters({...filters, status: 'approved'});
                    setIsFilterOpen(false);
                  }}
                >
                  Approved
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${filters.status === 'checked_in' ? 'bg-emerald-100 text-emerald-800' : ''}`}
                  onClick={() => {
                    setFilters({...filters, status: 'checked_in'});
                    setIsFilterOpen(false);
                  }}
                >
                  Checked In
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 hover:bg-emerald-50 transition-colors ${filters.status === 'checked_out' ? 'bg-emerald-100 text-emerald-800' : ''}`}
                  onClick={() => {
                    setFilters({...filters, status: 'checked_out'});
                    setIsFilterOpen(false);
                  }}
                >
                  Checked Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Cards */}
      <div className="mt-6">
        <h2 className="text-lg font-medium text-emerald-800 mb-4">
          {filteredVisitors.length} {filteredVisitors.length === 1 ? 'visitor' : 'visitors'} found
        </h2>
        
        {filteredVisitors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">No visitors found matching your criteria</p>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Grid view for desktop */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVisitors.map(visitor => (
                <VisitorCard key={visitor.id} visitor={visitor} />
              ))}
            </div>
            
            {/* List view for mobile */}
            <div className="md:hidden space-y-4">
              {filteredVisitors.map(visitor => (
                <VisitorCard key={visitor.id} visitor={visitor} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {/* <div className="mt-8">
        <Pagination
          currentPage={currentPage}
          totalItems={visitors.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div> */}

      {/* Modal */}
      {selectedVisitor && (
        <VisitorModal 
          visitor={selectedVisitor} 
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </div>
  );
};

export default Visitors;