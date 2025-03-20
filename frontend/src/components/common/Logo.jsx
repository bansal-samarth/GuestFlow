// src/components/common/Logo.jsx
import React from 'react';
import { FaUserCheck } from 'react-icons/fa';

const Logo = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="bg-blue-600 text-white p-3 rounded-full">
        <FaUserCheck size={24} />
      </div>
      <span className="text-2xl font-bold ml-2 text-blue-600">GuestFlow</span>
    </div>
  );
};

export default Logo;