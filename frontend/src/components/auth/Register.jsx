// src/components/auth/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaBuilding, FaUserTag, FaUserPlus } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Logo from '../common/Logo';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'employee',
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        department: formData.department,
        role: formData.role,
      });
      
      toast.success('Registration successful!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl flex bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 lg:w-2/5 p-8 md:p-12">
          <div className="mb-8 text-center">
            <Logo />
            <h2 className="text-3xl font-bold text-emerald-800 mt-6">Create Account 🌱</h2>
            <p className="text-emerald-600 mt-2">Join GuestFlow's Visitor Management Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-emerald-800 mb-2 font-medium">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                  <FaUser className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="username"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Choose a username"
                  value={formData.username.toLowerCase()}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-emerald-800 mb-2 font-medium">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                  <FaEnvelope className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-emerald-800 mb-2 font-medium">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                    <FaLock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-emerald-800 mb-2 font-medium">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                    <FaLock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-emerald-800 mb-2 font-medium">Department (optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                  <FaBuilding className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  name="department"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="e.g. Human Resources"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-emerald-800 mb-2 font-medium">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                  <FaUserTag className="w-5 h-5" />
                </div>
                <select
                  name="role"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all appearance-none bg-white"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="employee">Employee</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-300 flex items-center justify-center gap-2 mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loader border-2 border-white/30 border-t-white"></span>
              ) : (
                <>
                  <FaUserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-emerald-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-800 font-semibold hover:text-emerald-900 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Graphic */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 items-center justify-center relative">
          <div className="absolute inset-0 bg-opacity-10 bg-white/10"></div>
          <div className="relative text-center space-y-6">
            <h1 className="text-4xl font-bold text-white mb-4">GuestFlow</h1>
            <div className="space-y-4">
              <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-white mb-2">Join Our Platform</h3>
                <p className="text-emerald-100">
                  Access powerful tools for visitor management, digital check-ins, and detailed analytics
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-2 w-2 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;