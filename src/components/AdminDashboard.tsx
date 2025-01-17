import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../lib/firebase';
import { ref, onValue, set, push } from 'firebase/database';
import { Download, Users, BarChart, Flag, Plus } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [newUser, setNewUser] = useState({ 
    username: '', 
    role: 'coder', 
    assignedBatchId: '' 
  });

  // Load users
  useEffect(() => {
    const usersRef = ref(database, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.entries(data).map(([id, userData]) => ({
          id,
          ...userData
        }));
        setUsers(usersArray);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load classifications
  useEffect(() => {
    const classificationsRef = ref(database, 'classifications');
    const unsubscribe = onValue(classificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const classificationsArray = Object.entries(data).map(([id, classData]) => ({
          id,
          ...classData
        }));
        setClassifications(classificationsArray);
        
        // Filter flagged items
        const flagged = classificationsArray.filter(c => c.flagged);
        setFlaggedItems(flagged);
      }
    });
    return () => unsubscribe();
  }, []);

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const userRef = push(ref(database, 'users'));
      await set(userRef, {
        ...newUser,
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      });
      setNewUser({ username: '', role: 'coder', assignedBatchId: '' });
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // Export data as CSV
  const exportData = () => {
    const csvData = classifications.map(c => ({
      text_id: c.textId,
      coder: c.userId,
      category: c.category,
      timestamp: c.timestamp,
      flagged: c.flagged ? 'yes' : 'no',
      flag_notes: c.flagNotes || '',
      batch_id: c.batchId
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(obj => Object.values(obj).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classifications_export_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Calculate progress statistics
  const calculateProgress = (userId) => {
    const userClassifications = classifications.filter(c => c.userId === userId);
    return userClassifications.length;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={exportData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: 'users', name: 'Users', icon: Users },
              { id: 'progress', name: 'Progress', icon: BarChart },
              { id: 'flagged', name: 'Flagged Items', icon: Flag }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className={`w-5 h-5 mr-2 
                  ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}`}
                />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Users Tab Content */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Create User Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Batch ID"
                    value={newUser.assignedBatchId}
                    onChange={(e) => setNewUser({...newUser, assignedBatchId: e.target.value})}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create User
                  </button>
                </div>
              </form>
            </div>

            {/* Users Table */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.assignedBatchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{calculateProgress(user.id)} texts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Progress Tab Content */}
        {activeTab === 'progress' && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            {users.map(user => {
              const progress = calculateProgress(user.id);
              return (
                <div key={user.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-900">
                    <span>{user.username}</span>
                    <span>{progress} texts</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress / 100) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Flagged Items Tab Content */}
        {activeTab === 'flagged' && (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {flaggedItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.textId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {users.find(u => u.id === item.userId)?.username || item.userId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.flagNotes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;