import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiFilter, FiEye } from 'react-icons/fi';
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
          className={`${sizeClass} rounded-full object-cover`}
          onError={() => handleImageError(visitor.id)}
        />
      );
    } else {
      return (
        <div className={`${sizeClass} bg-emerald-100 rounded-full flex items-center justify-center`}>
          <span className={`text-emerald-600 ${textSizeClass}`}>
            {visitor.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }
  };

  const VisitorModal = ({ visitor, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-emerald-800">Visitor Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <VisitorAvatar visitor={visitor} size="large" />
              <div>
                <p className="text-xl font-semibold text-emerald-800">{visitor.full_name}</p>
                <p className="text-sm text-emerald-600">ID: {visitor.id}</p>
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              <p><span className="font-medium text-emerald-800">Email:</span> {visitor.email || '-'}</p>
              <p><span className="font-medium text-emerald-800">Phone:</span> {visitor.phone || '-'}</p>
              <p><span className="font-medium text-emerald-800">Badge ID:</span> {visitor.badge_id || '-'}</p>
            </div>
          </div>

          {/* Visit Details */}
          <div className="space-y-2">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="font-medium text-emerald-800 mb-2">Visit Information</p>
              <p><span className="font-medium">Purpose:</span> {visitor.purpose}</p>
              <p><span className="font-medium">Host ID:</span> {visitor.host_id}</p>
              {visitor.pre_approved && (
                <>
                  <p><span className="font-medium">Approval Window:</span></p>
                  <p>{format(parseISO(visitor.approval_window_start), 'MMM dd, yyyy HH:mm')} - </p>
                  <p>{format(parseISO(visitor.approval_window_end), 'MMM dd, yyyy HH:mm')}</p>
                </>
              )}
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="font-medium text-emerald-800 mb-2">Status Information</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                  visitor.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                  visitor.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {visitor.status}
                </span>
              </p>
              {visitor.check_in_time && (
                <p><span className="font-medium">Check-in:</span> {" "}
                  {format(parseISO(visitor.check_in_time), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
              {visitor.check_out_time && (
                <p><span className="font-medium">Check-out:</span> {" "}
                  {format(parseISO(visitor.check_out_time), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 p-4">
      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-emerald-800">Visitor Management</h1>
        
        <div className="w-full md:w-auto flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID or badge..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <select
              className="pl-10 pr-4 py-2 rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>
            <FiFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-4 text-left text-emerald-800">Visitor</th>
              <th className="px-6 py-4 text-left text-emerald-800">Status</th>
              <th className="px-6 py-4 text-left text-emerald-800">Check-in Time</th>
              <th className="px-6 py-4 text-left text-emerald-800">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-emerald-100">
            {filteredVisitors.map(visitor => (
              <tr key={visitor.id} className="hover:bg-emerald-50 transition-colors">
                <td className="px-6 py-4">
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
                </td>
                
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm 
                    ${visitor.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                      visitor.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {visitor.status.replace('_', ' ')}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  {visitor.check_in_time ? 
                    format(parseISO(visitor.check_in_time), 'MMM dd, yyyy HH:mm') : '-'}
                </td>
                
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setSelectedVisitor(visitor)}
                    className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-100"
                  >
                    <FiEye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVisitors.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No visitors found matching your criteria
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={visitors.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

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