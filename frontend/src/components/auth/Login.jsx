// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Logo from '../common/Logo';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
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
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', formData);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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
            <h2 className="text-3xl font-bold text-emerald-800 mt-6">Welcome Back! 🌿</h2>
            <p className="text-emerald-600 mt-2">Sign in to continue to GuestFlow</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-emerald-800 font-medium">Password</label>
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-800 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-emerald-500">
                  <FaLock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-emerald-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-300 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loader border-2 border-white/30 border-t-white"></span>
              ) : (
                <>
                  <FaSignInAlt className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-emerald-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-800 font-semibold hover:text-emerald-900 transition-colors">
                Create Account
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
                <h3 className="text-xl font-semibold text-white mb-2">Modern Visitor Management</h3>
                <p className="text-emerald-100">
                  Streamline visitor registration, enhance security, and create memorable first impressions
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

export default Login;