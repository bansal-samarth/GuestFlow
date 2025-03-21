import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaCalendar, FaCamera } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import emailjs from '@emailjs/browser';
import { jwtDecode } from 'jwt-decode';

const NewVisitor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    host_id: '',
    photo: null,
    pre_approved: false,
    approval_window_start: '',
    approval_window_end: ''
  });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const sendEmail = async (visitorData, isPreApproved) => {
    // Make sure we have an email to send to
    if (!visitorData.email) {
      console.error('Cannot send email: visitor email is missing');
      toast.error('Email notification failed: recipient email is missing');
      return;
    }

    const templateParams = {
      // Make sure to include the required EmailJS template variables
      name: visitorData.full_name,
      email: visitorData.email,
      from_name: 'GuestFlow Team',
      company: 'GuestFlow Inc.',
      purpose: visitorData.purpose,
      visit_date: new Date().toLocaleDateString(),
      host_id: visitorData.host_id || 'N/A',
      approval_start: visitorData.approval_window_start || 'N/A',
      approval_end: visitorData.approval_window_end || 'N/A'
    };

    try {
      const response = await emailjs.send(
        'service_t9l0pxl',
        isPreApproved ? 'PREAPPROVED_TEMPLATE' : 'REGULAR_TEMPLATE',
        templateParams,
        '6qwCch5e33qe914eE'
      );
      
      if (response.status === 200) {
        toast.success('Confirmation email sent!');
      } else {
        throw new Error(`Email failed with status: ${response.status}`);
      }
    } catch (emailError) {
      console.error('Email failed to send:', emailError);
      toast.error(`Email notification failed: ${emailError.text || 'Unknown error'}`);
    }
  };

  // Get current user ID from JWT token
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = jwtDecode(token);
    return decoded.sub; // Assuming JWT subject contains user ID
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('Photo size should be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.photo) {
      toast.error('Please upload a visitor photo');
      return;
    }

    if (!formData.email) {
      toast.error('Email address is required');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = formData.pre_approved 
        ? '/visitors/pre-approve' 
        : '/visitors/not-pre-approve';

      const payload = formData.pre_approved ? {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        purpose: formData.purpose,
        photo: formData.photo,
        approval_window_start: formData.approval_window_start,
        approval_window_end: formData.approval_window_end
      } : {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        purpose: formData.purpose,
        host_id: formData.host_id,
        photo: formData.photo
      };

      const response = await axios.post(`http://localhost:5000/api${endpoint}`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Make sure we have a valid visitor object from the response
      const visitorData = response.data.visitor;
      
      if (!visitorData) {
        throw new Error('Invalid response from server');
      }

      // Only set QR code data for pre-approved visitors
      if (formData.pre_approved) {
        const checkInUrl = `http://localhost:5000/api/visitors/${visitorData.id}/check-in`;
        setQrCodeData(checkInUrl);
      }

      // Send corresponding email based on pre-approval status
      await sendEmail(visitorData, formData.pre_approved);

      toast.success(`Visitor ${formData.pre_approved ? 'pre-approved' : 'registered'} successfully!`);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to process visitor');
    } finally {
      setIsLoading(false);
    }
  };

  // Display success message and QR code for pre-approved visitors
  if (registrationSuccess) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        {formData.pre_approved ? (
          <>
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">Pre-approval Successful!</h2>
            <div className="text-center">
              <p className="mb-4 text-emerald-600">Scan this QR code for check-in:</p>
              <div className="inline-block p-4 bg-white rounded-lg border border-emerald-100">
                <QRCode value={qrCodeData} size={256} />
                <p className="mt-4 text-sm text-emerald-600">
                  Check-in URL: <span className="font-mono">{qrCodeData}</span>
                </p>
              </div>
              <p className="mt-4 text-emerald-600">
                An email with this QR code has been sent to the visitor's email address.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-emerald-800 mb-4">Registration Successful!</h2>
            <div className="text-center">
              <p className="mb-4 text-emerald-600">
                The visitor has been successfully registered. 
              </p>
              <p className="mb-4 text-emerald-600">
                A confirmation email has been sent to {formData.email}.
              </p>
            </div>
          </>
        )}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard/visitors')}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Visitors List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-emerald-800 mb-6">
        {formData.pre_approved ? 'Pre-approve' : 'Register'} New Visitor
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-emerald-800 mb-2 font-medium">Full Name *</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
              <FaUser className="w-5 h-5" />
            </div>
            <input
              type="text"
              name="full_name"
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block text-emerald-800 mb-2 font-medium">Email *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                <FaEnvelope className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-emerald-800 mb-2 font-medium">Phone *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                <FaPhone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                name="phone"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                placeholder="+1 234 567 890"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Company & Host ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company */}
          <div>
            <label className="block text-emerald-800 mb-2 font-medium">Company</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                <FaBuilding className="w-5 h-5" />
              </div>
              <input
                type="text"
                name="company"
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                placeholder="Company Name (optional)"
                value={formData.company}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Host ID (only for non-pre-approved) */}
          {!formData.pre_approved && (
            <div>
              <label className="block text-emerald-800 mb-2 font-medium">Host ID *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                  <FaUser className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="host_id"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Host Employee ID"
                  value={formData.host_id}
                  onChange={handleChange}
                  required={!formData.pre_approved}
                />
              </div>
            </div>
          )}
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-emerald-800 mb-2 font-medium">Purpose *</label>
          <textarea
            name="purpose"
            className="w-full px-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            placeholder="Meeting purpose..."
            rows="3"
            value={formData.purpose}
            onChange={handleChange}
            required
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-emerald-800 mb-2 font-medium">
            Visitor Photo *
            <span className="text-sm text-gray-500 ml-2">(max 2MB)</span>
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg cursor-pointer hover:bg-emerald-200 transition-colors">
              <FaCamera className="mr-2" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                required
              />
            </label>
            {formData.photo && (
              <img 
                src={formData.photo} 
                alt="Preview" 
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Pre-approval Section */}
        <div className="space-y-4 border-t border-emerald-100 pt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="pre_approved"
              checked={formData.pre_approved}
              onChange={handleChange}
              className="h-4 w-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500"
            />
            <label className="ml-2 text-emerald-800 font-medium">Pre-approve Visitor</label>
          </div>

          {formData.pre_approved && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-emerald-800 mb-2 font-medium">Approval Start *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                    <FaCalendar className="w-5 h-5" />
                  </div>
                  <input
                    type="datetime-local"
                    name="approval_window_start"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    value={formData.approval_window_start}
                    onChange={handleChange}
                    required={formData.pre_approved}
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-800 mb-2 font-medium">Approval End *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                    <FaCalendar className="w-5 h-5" />
                  </div>
                  <input
                    type="datetime-local"
                    name="approval_window_end"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    value={formData.approval_window_end}
                    onChange={handleChange}
                    required={formData.pre_approved}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              formData.pre_approved ? 'Pre-approve Visitor' : 'Register Visitor'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewVisitor;