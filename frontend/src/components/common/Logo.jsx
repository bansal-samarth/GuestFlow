import React from 'react';
import { FaUserCheck } from 'react-icons/fa';

const Logo = () => {
  return (
    <div className="flex items-center">
      <div className="relative">
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white p-3 rounded-full shadow-md">
          <FaUserCheck size={24} />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full shadow-sm"></div>
      </div>
      <div className="ml-3">
        <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
          Guest<span className="font-extrabold text-teal-600">Flow</span>
        </span>
        <div className="h-1 w-12 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mt-1"></div>
      </div>
    </div>
  );
};

export default Logo;