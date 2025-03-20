// src/components/dashboard/Visitors.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/visitors', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setVisitors(response.data.visitors);
      } catch (error) {
        toast.error('Failed to fetch visitors');
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-emerald-800">Visitor Management</h1>
        <Link
          to="/dashboard/visitors/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          + New Visitor
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-emerald-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-emerald-800">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-emerald-800">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-emerald-800">Check-in</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-emerald-800">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-100">
            {visitors.map((visitor) => (
              <tr key={visitor.id}>
                <td className="px-6 py-4">{visitor.full_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    visitor.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                    visitor.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {visitor.status}
                  </span>
                </td>
                <td className="px-6 py-4">{visitor.check_in_time || '-'}</td>
                <td className="px-6 py-4 space-x-2">
                  <button className="text-emerald-600 hover:text-emerald-800">
                    View
                  </button>
                  <button className="text-emerald-600 hover:text-emerald-800">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Visitors;