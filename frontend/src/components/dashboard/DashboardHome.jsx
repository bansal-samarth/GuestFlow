// src/components/dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Updated StatCard component with fixed styling
const StatCard = ({ title, value, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-800',
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800'
  };
  
  return (
    <div className={`p-6 rounded-xl ${colorClasses[color]}`}>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

const DashboardHome = () => {
  const [stats, setStats] = useState({
    checked_in: 0,
    pending: 0,
    today_visitors: 0,
    total_visitors: 0
  });

  useEffect(() => {
    console.log('Current token:', localStorage.getItem('token'));
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Directly use the API response structure
        setStats(response.data);
        
      } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        toast.error('Failed to load dashboard stats');
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-emerald-800">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Visitors" 
          value={stats.total_visitors} 
          color="emerald" 
        />
        <StatCard 
          title="Today's Visitors" 
          value={stats.today_visitors} 
          color="emerald" 
        />
        <StatCard 
          title="Checked In" 
          value={stats.checked_in} 
          color="green" 
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pending} 
          color="amber" 
        />
      </div>

      {/* Debug output - remove in production */}
      <div className="mt-8 p-4 bg-white rounded-lg">
        <h3 className="text-lg font-semibold text-emerald-800 mb-2">Raw Data:</h3>
        <pre className="text-sm bg-gray-50 p-4 rounded">
          {JSON.stringify(stats, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DashboardHome;