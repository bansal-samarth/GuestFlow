import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiEye, FiCheck, FiX, FiCalendar, FiMail, FiPhone, FiBriefcase, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import emailjs from '@emailjs/browser';
import qrcode from 'qrcode';
import Pagination from '../common/Pagination';

const PendingVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageErrors, setImageErrors] = useState({});
  const [processingAction, setProcessingAction] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPendingVisitors();
  }, [currentPage]);

  const fetchPendingVisitors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/visitors', {
        params: {
          status: 'pending',
          page: currentPage,
          limit: itemsPerPage
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setVisitors(response.data.visitors);
    } catch (error) {
      toast.error('Failed to fetch pending visitors');
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter for pending visitors AND search term
  const filteredVisitors = visitors
    .filter(visitor => visitor.status === 'pending')
    .filter(visitor => {
      return visitor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.id.toString().includes(searchTerm) ||
        visitor.badge_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.company?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  // Handle image loading errors
  const handleImageError = (visitorId) => {
    setImageErrors(prev => ({
      ...prev,
      [visitorId]: true
    }));
  };

  // Send email to visitor
  const sendEmail = async (visitorData, isApproved) => {
    if (!visitorData.email) {
      console.error('Cannot send email: visitor email is missing');
      toast.error('Email notification failed: recipient email is missing');
      return;
    }

    let qrCodeBase64 = '';
    if (isApproved) {
      try {
        const checkInUrl = `http://localhost:5000/api/visitors/${visitorData.id}/check-in`;
        qrCodeBase64 = await qrcode.toDataURL(checkInUrl, { width: 200 });
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    }

    const templateParams = {
      name: visitorData.full_name,
      email: visitorData.email,
      from_name: 'GuestFlow Team',
      company: 'GuestFlow Inc.',
      purpose: visitorData.purpose,
      visit_date: visitorData.approval_window_start ? 
        format(parseISO(visitorData.approval_window_start), 'MMM dd, yyyy') : 
        new Date().toLocaleDateString(),
      host_id: visitorData.host_id || 'N/A',
      approval_start: visitorData.approval_window_start ? 
        format(parseISO(visitorData.approval_window_start), 'MMM dd, yyyy HH:mm') : 'N/A',
      approval_end: visitorData.approval_window_end ? 
        format(parseISO(visitorData.approval_window_end), 'MMM dd, yyyy HH:mm') : 'N/A',
      qr_code: qrCodeBase64,
      status: isApproved ? 'approved' : 'rejected',
      message: isApproved ? 
        'Your visit has been approved. Please use the QR code below for check-in.' : 
        'We regret to inform you that your visit request has been rejected.'
    };

    try {
      const response = await emailjs.send(
        'service_96w0zr2',
        isApproved ? 'APPROVAL_TEMPLATE' : 'REJECTION_TEMPLATE',
        templateParams,
        'd3E7xFu8nBnZQ6ARE'
      );
      
      if (response.status === 200) {
        toast.success(`Notification email sent to ${visitorData.email}`);
      } else {
        throw new Error(`Email failed with status: ${response.status}`);
      }
    } catch (emailError) {
      console.error('Email failed to send:', emailError);
      toast.error(`Email notification failed: ${emailError.text || 'Unknown error'}`);
    }
  };

  const handleApproveVisitor = async (visitorId) => {
    setProcessingAction(true);
    try {
      const response = await axios.put(`/api/visitors/${visitorId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update visitors list with updated status
      const updatedVisitor = response.data.visitor;
      
      // Remove the visitor from the list
      setVisitors(prev => prev.filter(v => v.id !== visitorId));
      
      // Send email notification
      await sendEmail(updatedVisitor, true);
      
      toast.success('Visitor has been approved successfully');
    } catch (error) {
      console.error('Error approving visitor:', error);
      toast.error(error.response?.data?.message || 'Failed to approve visitor');
    } finally {
      setProcessingAction(false);
      setShowConfirmModal(null);
    }
  };

  const handleRejectVisitor = async (visitorId) => {
    setProcessingAction(true);
    try {
      const response = await axios.put(`/api/visitors/${visitorId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Remove the visitor from the list
      setVisitors(prev => prev.filter(v => v.id !== visitorId));
      
      // Send email notification
      await sendEmail(response.data.visitor, false);
      
      toast.success('Visitor has been rejected');
    } catch (error) {
      console.error('Error rejecting visitor:', error);
      toast.error(error.response?.data?.message || 'Failed to reject visitor');
    } finally {
      setProcessingAction(false);
      setShowConfirmModal(null);
    }
  };

  // Visitor Avatar component to handle both images and fallbacks
  const VisitorAvatar = ({ visitor, size = 'medium' }) => {
    const hasImageError = imageErrors[visitor.id];
    const sizeClass = size === 'large' ? 'h-20 w-20' : 'h-10 w-10';
    const textSizeClass = size === 'large' ? 'text-2xl' : 'text-lg';
    
    if (visitor.photo_path && !hasImageError) {
      return (
        <img
          src={visitor.photo_path}
          alt={visitor.full_name}
          className={`${sizeClass} rounded-full object-cover ring-2 ring-emerald-100`}
          onError={() => handleImageError(visitor.id)}
        />
      );
    } else {
      const initials = visitor.full_name
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
        
      return (
        <div className={`${sizeClass} bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-md`}>
          <span className={`text-white font-medium ${textSizeClass}`}>
            {initials}
          </span>
        </div>
      );
    }
  };

  const ConfirmationModal = ({ action, visitor, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <div className="flex items-center mb-4">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
            action === 'approve' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {action === 'approve' ? <FiCheck className="w-6 h-6" /> : <FiX className="w-6 h-6" />}
          </div>
          <h3 className="text-xl font-semibold text-gray-800 ml-4">
            {action === 'approve' ? 'Approve Visitor' : 'Reject Visitor'}
          </h3>
        </div>
        
        <div className="mb-6 bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center">
            <VisitorAvatar visitor={visitor} />
            <div className="ml-3">
              <p className="font-medium text-gray-800">{visitor.full_name}</p>
              <p className="text-sm text-gray-500">{visitor.company || 'No company'}</p>
            </div>
          </div>
        </div>
        
        <p className="mb-6 text-gray-600">
          Are you sure you want to {action === 'approve' ? 'approve' : 'reject'} this visitor request?
          {action === 'approve' 
            ? ' An approval email with QR code will be sent.' 
            : ' A rejection email will be sent.'}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={processingAction}
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processingAction}
            className={`px-5 py-2 rounded-lg text-white font-medium transition-colors ${
              action === 'approve' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-red-600 hover:bg-red-700'
            } ${processingAction ? 'opacity-50 cursor-not-allowed' : ''} shadow-sm`}
          >
            {processingAction ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              action === 'approve' ? 'Approve' : 'Reject'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const VisitorModal = ({ visitor, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold">Visitor Details</h2>
            <button 
              onClick={onClose} 
              className="bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30 transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left Column - Personal Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="flex flex-col items-center text-center">
                <VisitorAvatar visitor={visitor} size="large" />
                <div className="mt-3">
                  <p className="text-xl font-semibold text-gray-800">{visitor.full_name}</p>
                  <p className="text-sm text-emerald-600">ID: {visitor.id}</p>
                </div>
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-xl space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                    <FiMail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Email</p>
                    <p className="text-gray-800">{visitor.email || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                    <FiPhone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Phone</p>
                    <p className="text-gray-800">{visitor.phone || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                    <FiBriefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Company</p>
                    <p className="text-gray-800">{visitor.company || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Badge ID</p>
                    <p className="text-gray-800">{visitor.badge_id || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visit Details */}
            <div className="md:col-span-3 space-y-5">
              <div className="p-5 border border-emerald-200 rounded-xl">
                <p className="text-lg font-medium text-emerald-800 mb-3">Visit Information</p>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Purpose of Visit</p>
                    <p className="mt-1 text-gray-800">{visitor.purpose}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Host ID</p>
                    <p className="mt-1 text-gray-800">{visitor.host_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Status</p>
                    <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                      <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                      Pending
                    </span>
                  </div>
                  
                  {visitor.pre_approved && (
                    <div>
                      <p className="text-sm text-emerald-600 font-medium">Approval Window</p>
                      <div className="mt-1 space-y-1 text-gray-800">
                        <div className="flex items-center">
                          <FiCalendar className="text-emerald-500 mr-2" />
                          <p>{format(parseISO(visitor.approval_window_start), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="text-emerald-500 mr-2" />
                          <p>{format(parseISO(visitor.approval_window_start), 'HH:mm')} - {format(parseISO(visitor.approval_window_end), 'HH:mm')}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    setShowConfirmModal({ action: 'approve', visitor });
                    setSelectedVisitor(null);
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl flex items-center justify-center font-medium shadow-sm transition-all"
                >
                  <FiCheck className="mr-2" /> Approve Visitor
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal({ action: 'reject', visitor });
                    setSelectedVisitor(null);
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-xl flex items-center justify-center font-medium transition-all"
                >
                  <FiX className="mr-2" /> Reject Visitor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="py-10 px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
        <FiCheck className="w-8 h-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-1">All caught up!</h3>
      <p className="text-gray-500 max-w-md mx-auto">
        No pending visitor requests at the moment. New requests will appear here.
      </p>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-emerald-200 animate-spin border-t-emerald-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-emerald-500"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-emerald-50/40 min-h-screen">
      {/* Header and Search Section */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pending Visitor Requests</h1>
            <p className="text-emerald-600">Review and manage pending visitor approvals</p>
          </div>
          
          <div className="w-full md:w-64">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 text-emerald-400" />
              <input
                type="text"
                placeholder="Search visitors..."
                className="pl-10 pr-4 py-2 w-full rounded-xl border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Visitors Cards */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {filteredVisitors.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredVisitors.map(visitor => (
              <div 
                key={visitor.id} 
                className="border border-emerald-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="flex items-center mb-4 sm:mb-0">
                    <VisitorAvatar visitor={visitor} />
                    <div className="ml-3">
                      <p className="font-medium text-gray-800">{visitor.full_name}</p>
                      <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1">
                        {visitor.company && (
                          <span className="flex items-center mr-3 mb-1">
                            <FiBriefcase className="mr-1 text-emerald-500" size={14} />
                            {visitor.company}
                          </span>
                        )}
                        {visitor.email && (
                          <span className="flex items-center mr-3 mb-1">
                            <FiMail className="mr-1 text-emerald-500" size={14} />
                            {visitor.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setSelectedVisitor(visitor)}
                      className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center"
                    >
                      <FiEye className="mr-1" /> View
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal({ action: 'approve', visitor })}
                      className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center"
                    >
                      <FiCheck className="mr-1" /> Approve
                    </button>
                    <button 
                      onClick={() => setShowConfirmModal({ action: 'reject', visitor })}
                      className="px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center"
                    >
                      <FiX className="mr-1" /> Reject
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-emerald-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Purpose</p>
                    <p className="text-sm text-gray-800 line-clamp-1">{visitor.purpose}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Host ID</p>
                    <p className="text-sm text-gray-800">{visitor.host_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-emerald-600 font-medium">Status</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Pagination will go here when implemented */}

      {selectedVisitor && (
        <VisitorModal 
          visitor={selectedVisitor} 
          onClose={() => setSelectedVisitor(null)}
        />
      )}

      {showConfirmModal && (
        <ConfirmationModal 
          action={showConfirmModal.action}
          visitor={showConfirmModal.visitor}
          onConfirm={() => {
            if (showConfirmModal.action === 'approve') {
              handleApproveVisitor(showConfirmModal.visitor.id);
            } else {
              handleRejectVisitor(showConfirmModal.visitor.id);
            }
          }}
          onCancel={() => setShowConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default PendingVisitors;