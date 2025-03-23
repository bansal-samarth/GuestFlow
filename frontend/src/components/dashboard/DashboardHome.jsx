// src/components/dashboard/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  Calendar, Users, UserCheck, AlertTriangle, CheckSquare, 
  Calendar as CalendarIcon, Clock as ClockIcon, User, 
  Timer, FileCheck, TrendingUp, PieChart as PieChartIcon,
  BarChart as BarChartIcon, Clock
} from 'lucide-react';

// Modern Stat Card Component with Icon
const StatCard = ({ title, value, color, icon: Icon }) => {
  const colorClasses = {
    primary: 'bg-gradient-to-br from-green-50 to-emerald-100 border-emerald-200 text-emerald-800',
    secondary: 'bg-gradient-to-br from-teal-50 to-green-100 border-teal-200 text-teal-800',
    tertiary: 'bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 text-emerald-800',
    quaternary: 'bg-gradient-to-br from-green-50 to-teal-100 border-green-200 text-green-800',
  };
  
  const iconColors = {
    primary: 'text-emerald-600',
    secondary: 'text-teal-600',
    tertiary: 'text-emerald-600',
    quaternary: 'text-green-600',
  };
  
  return (
    <div className={`p-6 rounded-2xl border shadow-sm ${colorClasses[color]} transition-all hover:shadow-lg transform hover:-translate-y-1 duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium opacity-75">{title}</h3>
        <div className={`${iconColors[color]} bg-white p-2 rounded-full`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

// Recent Checked-Out Visitors Component
const RecentCheckedOutVisitors = ({ visitors }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <UserCheck className="text-emerald-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Recently Visited</h3>
      </div>
      <div className="space-y-3">
        {visitors.slice(0, 3).map(visitor => (
          <div key={visitor.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 transition-all hover:shadow-md">
            <div>
              <p className="font-medium text-gray-800">{visitor.full_name}</p>
              <p className="text-sm text-gray-500">{visitor.ago}</p>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(visitor.status)}`}>
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
  
  const COLORS = ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'];
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <PieChartIcon className="text-emerald-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Visitor Status Distribution</h3>
      </div>
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
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="text-emerald-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Visitor Check-ins (Last 7 Days)</h3>
      </div>
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
            <Area type="monotone" dataKey="visitors" name="Check-ins" fill="#10b981" stroke="#059669" />
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
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <Clock className="text-emerald-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Expected Visitors Today (Hourly)</h3>
      </div>
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
            <Bar dataKey="visitors" name="Expected Visitors" fill="#059669" radius={[4, 4, 0, 0]} />
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
    'pending': 'bg-amber-100 text-amber-800 border border-amber-200',
    'approved': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'rejected': 'bg-red-100 text-red-800 border border-red-200',
    'checked_in': 'bg-green-100 text-green-800 border border-green-200',
    'checked_out': 'bg-teal-100 text-teal-800 border border-teal-200'
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
        <div className="text-xl text-gray-500 animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen">
      <div className="max-w-screen-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard <span className="text-emerald-600">Overview</span></h1>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Clock size={16} className="text-emerald-500" />
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
        
        {/* Primary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Visitors" 
            value={stats.total_visitors} 
            color="primary"
            icon={Users}
          />
          <StatCard 
            title="Today's Visitors" 
            value={stats.today_visitors} 
            color="secondary"
            icon={Calendar}
          />
          <StatCard 
            title="Checked In" 
            value={stats.checked_in} 
            color="tertiary"
            icon={UserCheck}
          />
          <StatCard 
            title="Pending Approvals" 
            value={stats.pending} 
            color="quaternary"
            icon={AlertTriangle}
          />
        </div>
        
        {/* Secondary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Pre-Approved Visitors" 
            value={stats.pre_approved_count} 
            color="primary"
            icon={CheckSquare}
          />
          <StatCard 
            title="Avg. Visit Duration" 
            value={`${stats.avg_visit_duration} min`} 
            color="secondary"
            icon={Timer}
          />
          <StatCard 
            title="No Photo" 
            value={stats.no_photo_count} 
            color="tertiary"
            icon={User}
          />
          <StatCard 
            title="Documents Ready" 
            value={stats.total_visitors - stats.no_photo_count} 
            color="quaternary"
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
    </div>
  );
};

export default DashboardHome;