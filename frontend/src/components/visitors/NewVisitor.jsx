import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaCalendar, FaCamera, FaCheckCircle } from 'react-icons/fa';
import QRCode from 'react-qr-code';
import emailjs from '@emailjs/browser';
import { jwtDecode } from 'jwt-decode';
import qrcode from 'qrcode';

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

    let qrCodeBase64 = '';
    if (isPreApproved) {
      try {
        const checkInUrl = `http://localhost:5000/api/visitors/${visitorData.id}/check-in`;
        qrCodeBase64 = await qrcode.toDataURL(checkInUrl, { width: 200 });
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
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
      approval_end: visitorData.approval_window_end || 'N/A',
      qr_code: qrCodeBase64
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

  // Success view
  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-emerald-50 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 p-4 text-white">
            <h2 className="text-2xl font-bold">
              {formData.pre_approved ? "Pre-approval Successful" : "Registration Successful"}
            </h2>
          </div>
          <div className="p-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <FaCheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <p className="text-emerald-800 text-lg mb-6">
              {formData.pre_approved 
                ? "Visitor has been pre-approved. QR code has been generated for check-in." 
                : "Visitor has been successfully registered."}
            </p>
            {formData.pre_approved && (
              <div className="bg-white p-4 border border-emerald-100 rounded-lg mb-4">
                <QRCode value={qrCodeData} size={180} />
                <p className="mt-3 text-sm text-center text-emerald-600">
                  Scan this QR code at the reception
                </p>
              </div>
            )}
            <p className="text-emerald-700 text-center mb-6">
              A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>
            </p>
            <button
              onClick={() => navigate('/dashboard/visitors')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded-lg transition-colors"
            >
              Back to Visitors List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 py-6 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-500 p-5">
          <h2 className="text-2xl font-bold text-white">
            {formData.pre_approved ? 'Pre-approve' : 'Register'} New Visitor
          </h2>
          <p className="text-emerald-100 mt-1">Fill in the visitor details below</p>
        </div>
        
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Personal details */}
            <div className="lg:col-span-2">
              <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm h-full">
                <h3 className="text-emerald-800 font-semibold mb-4 pb-2 border-b border-emerald-100">
                  Visitor Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-emerald-700 mb-1 text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                        <FaUser className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                        placeholder="Enter full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-emerald-700 mb-1 text-sm font-medium">Email <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                        <FaEnvelope className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-emerald-700 mb-1 text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                        <FaPhone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                        placeholder="+1 (234) 567-8900"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-emerald-700 mb-1 text-sm font-medium">Company</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                        <FaBuilding className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        name="company"
                        className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                        placeholder="Organization (optional)"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  {/* Host ID (only for non-pre-approved) */}
                  {!formData.pre_approved && (
                    <div className="md:col-span-2">
                      <label className="block text-emerald-700 mb-1 text-sm font-medium">Host ID <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                          <FaUser className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="host_id"
                          className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                          placeholder="Employee ID of the host"
                          value={formData.host_id}
                          onChange={handleChange}
                          required={!formData.pre_approved}
                        />
                      </div>
                    </div>
                  )}

                  {/* Purpose */}
                  <div className="md:col-span-2">
                    <label className="block text-emerald-700 mb-1 text-sm font-medium">Visit Purpose <span className="text-red-500">*</span></label>
                    <textarea
                      name="purpose"
                      className="w-full px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                      placeholder="Describe the purpose of the visit..."
                      rows="2"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Photo upload and pre-approval */}
            <div className="lg:col-span-1">
              <div className="space-y-5">
                {/* Photo Upload Card */}
                <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                  <h3 className="text-emerald-800 font-semibold mb-4 pb-2 border-b border-emerald-100">
                    Visitor Photo
                  </h3>
                  
                  <div className="flex flex-col items-center">
                    {formData.photo ? (
                      <div className="mb-4">
                        <img 
                          src={formData.photo} 
                          alt="Preview" 
                          className="h-36 w-36 rounded-full object-cover border-2 border-emerald-300 shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-36 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                        <FaCamera className="w-12 h-12 text-emerald-300" />
                      </div>
                    )}
                    
                    <label className="flex items-center justify-center w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg cursor-pointer hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-sm text-sm">
                      <FaCamera className="mr-2" />
                      {formData.photo ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <p className="text-xs text-emerald-600 mt-2 text-center">Max file size: 2MB</p>
                  </div>
                </div>

                {/* Pre-approval Card */}
                <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-100">
                    <h3 className="text-emerald-800 font-semibold">Pre-approval</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="pre_approved"
                        checked={formData.pre_approved}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {formData.pre_approved && (
                    <div className="space-y-3 animate-fadeIn">
                      <div>
                        <label className="block text-emerald-700 mb-1 text-sm font-medium">Start Date & Time <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                            <FaCalendar className="w-4 h-4" />
                          </div>
                          <input
                            type="datetime-local"
                            name="approval_window_start"
                            className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                            value={formData.approval_window_start}
                            onChange={handleChange}
                            required={formData.pre_approved}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-emerald-700 mb-1 text-sm font-medium">End Date & Time <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-emerald-500">
                            <FaCalendar className="w-4 h-4" />
                          </div>
                          <input
                            type="datetime-local"
                            name="approval_window_end"
                            className="w-full pl-10 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 outline-none transition-all"
                            value={formData.approval_window_end}
                            onChange={handleChange}
                            required={formData.pre_approved}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!formData.pre_approved && (
                    <p className="text-sm text-emerald-700 mt-2">
                      Enable pre-approval to generate a QR code for this visitor
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-700 to-emerald-500 text-white py-3 px-6 rounded-lg font-medium hover:from-emerald-800 hover:to-emerald-600 transition-all flex items-center justify-center shadow-md"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <span className="flex items-center">
                  {formData.pre_approved ? 'Pre-approve Visitor' : 'Register Visitor'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewVisitor;