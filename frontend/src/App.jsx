import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import Visitors from './components/visitors/Visitors';
import ProtectedRoute from './components/common/ProtectedRoute';
import NewVisitor from './components/visitors/NewVisitor';
import CheckIn from './components/visitors/CheckIn';
import PendingVisitors from './components/visitors/Pending';
import CheckOutPage from './components/visitors/CheckOut';


import './index.css';


const App = () => {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="/dashboard/visitors" element={<Visitors />} />
            <Route path="/dashboard/visitors/new" element={<NewVisitor />} />
            <Route path="/dashboard/visitors/check-in" element={<CheckIn />} />
            <Route path="/dashboard/visitors/pending" element={<PendingVisitors />} />
            <Route path="/dashboard/visitors/check-out" element={<CheckOutPage />} />
            {/* Add other dashboard routes here */}
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;