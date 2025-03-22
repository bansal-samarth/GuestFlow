// src/components/dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Calendar, Clock, Users, UserCheck, AlertTriangle, CheckSquare, 
  Calendar as CalendarIcon, Clock as ClockIcon, User, 
  Timer, FileCheck
} from 'lucide-react';

// Styled Stat Card Component with Icon
const StatCard = ({ title, value, color, icon: Icon }) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    teal: 'bg-teal-50 border-teal-200 text-teal-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
  };
  
  const iconColors = {
    emerald: 'text-emerald-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    teal: 'text-teal-600',
    rose: 'text-rose-600',
  };
  
  return (
    <div className={`p-6 rounded-xl border shadow-sm ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className={`${iconColors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

// Recent Checked-Out Visitors Component
const RecentCheckedOutVisitors = ({ visitors }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Checked-Out Visitors</h3>
      <div className="space-y-3">
        {visitors.map(visitor => (
          <div key={visitor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-800">{visitor.full_name}</p>
              <p className="text-sm text-gray-500">{visitor.ago}</p>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(visitor.status)}`}>
                {formatStatus(visitor.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Status Chart Component
const StatusChart = ({ statusDistribution }) => {
  const statusData = Object.keys(statusDistribution).map(status => ({
    name: formatStatus(status),
    value: statusDistribution[status]
  }));
  
  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Visitor Status Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Visitors']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Daily Visitors Trend Component
const VisitorTrend = ({ dailyTrend }) => {
  const trendData = Object.keys(dailyTrend).map(date => ({
    date,
    visitors: dailyTrend[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Visitor Check-ins (Last 7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trendData}
            margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
            />
            <YAxis allowDecimals={false} />
            <Tooltip 
              formatter={(value) => [`${value} visitors`, 'Check-ins']}
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <Legend />
            <Area type="monotone" dataKey="visitors" name="Check-ins" fill="#3b82f6" stroke="#2563eb" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Hourly Occupancy Forecast Component
const HourlyOccupancy = ({ hourlyExpected }) => {
  const hourlyData = Object.keys(hourlyExpected).map(hour => ({
    hour,
    visitors: hourlyExpected[hour]
  }));
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Expected Visitors Today (Hourly)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={hourlyData}
            margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="hour" 
              tickFormatter={(hour) => hour}
            />
            <YAxis allowDecimals={false} />
            <Tooltip 
              formatter={(value) => [`${value} visitors`, 'Expected']}
              labelFormatter={(hour) => `Time: ${hour}`}
            />
            <Legend />
            <Bar dataKey="visitors" name="Expected Visitors" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Helper functions
const formatStatus = (status) => {
  const formattedStatus = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'checked_in': 'Checked In',
    'checked_out': 'Checked Out'
  };
  return formattedStatus[status] || status;
};

const getStatusColor = (status) => {
  const statusColors = {
    'pending': 'bg-amber-100 text-amber-800',
    'approved': 'bg-blue-100 text-blue-800',
    'rejected': 'bg-red-100 text-red-800',
    'checked_in': 'bg-green-100 text-green-800',
    'checked_out': 'bg-purple-100 text-purple-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

const DashboardHome = () => {
  const [stats, setStats] = useState({
    checked_in: 0,
    pending: 0,
    today_visitors: 0,
    total_visitors: 0,
    pre_approved_count: 0,
    no_photo_count: 0,
    avg_visit_duration: 0,
    status_distribution: {},
    hourly_expected: {},
    daily_trend: {},
    recent_checked_out: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch enhanced stats
        const statsResponse = await axios.get('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setStats(statsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        toast.error('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Primary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Visitors" 
          value={stats.total_visitors} 
          color="emerald"
          icon={Users}
        />
        <StatCard 
          title="Today's Visitors" 
          value={stats.today_visitors} 
          color="blue"
          icon={Calendar}
        />
        <StatCard 
          title="Checked In" 
          value={stats.checked_in} 
          color="green"
          icon={UserCheck}
        />
        <StatCard 
          title="Pending Approvals" 
          value={stats.pending} 
          color="amber"
          icon={AlertTriangle}
        />
      </div>
      
      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pre-Approved Visitors" 
          value={stats.pre_approved_count} 
          color="indigo"
          icon={CheckSquare}
        />
        <StatCard 
          title="Avg. Visit Duration" 
          value={`${stats.avg_visit_duration} min`} 
          color="purple"
          icon={Timer}
        />
        <StatCard 
          title="No Photo" 
          value={stats.no_photo_count} 
          color="rose"
          icon={User}
        />
        <StatCard 
          title="Documents Ready" 
          value={stats.total_visitors - stats.no_photo_count} 
          color="teal"
          icon={FileCheck}
        />
      </div>
      
      {/* Main Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Expected Hourly Occupancy */}
        <HourlyOccupancy hourlyExpected={stats.hourly_expected} />
        
        {/* Status Distribution */}
        <StatusChart statusDistribution={stats.status_distribution} />
      </div>
      
      {/* Main Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <VisitorTrend dailyTrend={stats.daily_trend} />
        
        {/* Recent Checked-Out Visitors */}
        <RecentCheckedOutVisitors visitors={stats.recent_checked_out} />
      </div>
    </div>
  );
};

export default DashboardHome;