import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch, FiEye, FiCheck, FiX } from 'react-icons/fi';
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

  const filteredVisitors = visitors.filter(visitor => {
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
        'service_mqdzlpr',
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
      
      // Update visitors list
      setVisitors(prev => prev.map(v => 
        v.id === visitorId ? response.data.visitor : v
      ));
      
      // Send email notification
      await sendEmail(response.data.visitor, true);
      
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
      
      // Update visitors list
      setVisitors(prev => prev.map(v => 
        v.id === visitorId ? response.data.visitor : v
      ));
      
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

  const ConfirmationModal = ({ action, visitor, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-emerald-800 mb-4">
          {action === 'approve' ? 'Approve Visitor' : 'Reject Visitor'}
        </h3>
        <p className="mb-6">
          Are you sure you want to {action === 'approve' ? 'approve' : 'reject'} {visitor.full_name}'s request?
          {action === 'approve' 
            ? ' An approval email with QR code will be sent.' 
            : ' A rejection email will be sent.'}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={processingAction}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processingAction}
            className={`px-4 py-2 rounded-lg text-white ${
              action === 'approve' 
                ? 'bg-emerald-600 hover:bg-emerald-700' 
                : 'bg-red-600 hover:bg-red-700'
            } ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
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
              <p><span className="font-medium text-emerald-800">Company:</span> {visitor.company || '-'}</p>
              <p><span className="font-medium text-emerald-800">Badge ID:</span> {visitor.badge_id || '-'}</p>
            </div>
          </div>

          {/* Visit Details */}
          <div className="space-y-2">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <p className="font-medium text-emerald-800 mb-2">Visit Information</p>
              <p><span className="font-medium">Purpose:</span> {visitor.purpose}</p>
              <p><span className="font-medium">Host ID:</span> {visitor.host_id}</p>
              <p><span className="font-medium">Status:</span> 
                <span className="ml-2 px-2 py-1 rounded-full text-sm bg-amber-100 text-amber-800">
                  Pending
                </span>
              </p>
              {visitor.pre_approved && (
                <>
                  <p><span className="font-medium">Approval Window:</span></p>
                  <p>{format(parseISO(visitor.approval_window_start), 'MMM dd, yyyy HH:mm')} - </p>
                  <p>{format(parseISO(visitor.approval_window_end), 'MMM dd, yyyy HH:mm')}</p>
                </>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <button
                onClick={() => {
                  setShowConfirmModal({ action: 'approve', visitor });
                  setSelectedVisitor(null);
                }}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center"
              >
                <FiCheck className="mr-2" /> Approve Visitor
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal({ action: 'reject', visitor });
                  setSelectedVisitor(null);
                }}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center"
              >
                <FiX className="mr-2" /> Reject Visitor
              </button>
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
      {/* Header and Search Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-emerald-800">Pending Visitor Requests</h1>
        
        <div className="w-full md:w-auto flex gap-2">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-emerald-100 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pending Visitors Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-4 text-left text-emerald-800">Visitor</th>
              <th className="px-6 py-4 text-left text-emerald-800">Contact Info</th>
              <th className="px-6 py-4 text-left text-emerald-800">Purpose</th>
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
                        {visitor.company && <p>Company: {visitor.company}</p>}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <p className="text-sm">{visitor.email}</p>
                  <p className="text-sm">{visitor.phone}</p>
                </td>
                
                <td className="px-6 py-4">
                  <p className="text-sm line-clamp-2">{visitor.purpose}</p>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedVisitor(visitor)}
                      className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-100"
                      title="View Details"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={() => setShowConfirmModal({ action: 'approve', visitor })}
                      className="text-emerald-600 hover:text-emerald-800 p-2 rounded-lg hover:bg-emerald-100"
                      title="Approve"
                    >
                      <FiCheck className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={() => setShowConfirmModal({ action: 'reject', visitor })}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-100"
                      title="Reject"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVisitors.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No pending visitor requests found
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