import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../config/api';
import { FiSearch, FiUserPlus, FiCheck, FiX, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const { isOnline } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchRequests();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await api.get('/users/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests');
    }
  };

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/connect/${userId}`);
      toast.success('Connection request sent!');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await api.put(`/users/accept/${userId}`);
      toast.success('Connection accepted!');
      fetchRequests();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await api.put(`/users/reject/${userId}`);
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConnectionButton = (user) => {
    switch (user.connectionStatus) {
      case 'connected':
        return (
          <Link to={`/messages/${user._id}`} className="action-button message-btn">
            <FiMessageCircle />
            <span>Message</span>
          </Link>
        );
      case 'pending':
        return (
          <button className="action-button pending-btn" disabled>
            <FiUserPlus />
            <span>Pending</span>
          </button>
        );
      case 'received':
        return (
          <div className="request-actions">
            <button
              onClick={() => handleAcceptRequest(user._id)}
              className="action-button accept-btn"
            >
              <FiCheck />
            </button>
            <button
              onClick={() => handleRejectRequest(user._id)}
              className="action-button reject-btn"
            >
              <FiX />
            </button>
          </div>
        );
      default:
        return (
          <button
            onClick={() => handleConnect(user._id)}
            className="action-button connect-btn"
          >
            <FiUserPlus />
            <span>Connect</span>
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, <span className="user-name">{user?.name}</span>!
        </h1>
        <p className="welcome-subtitle">Connect with other creators and grow your network</p>
      </div>

      {requests.length > 0 && (
        <div className="requests-section">
          <h2 className="section-title">Connection Requests</h2>
          <div className="requests-grid">
            {requests.map((requester) => (
              <div key={requester._id} className="request-card">
                <img
                  src={requester.avatar}
                  alt={requester.name}
                  className="request-avatar"
                />
                <div className="request-info">
                  <h3 className="request-name">{requester.name}</h3>
                  <p className="request-email">{requester.email}</p>
                </div>
                <div className="request-actions">
                  <button
                    onClick={() => handleAcceptRequest(requester._id)}
                    className="request-btn accept"
                  >
                    <FiCheck />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(requester._id)}
                    className="request-btn reject"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="users-section">
        <div className="users-header">
          <h2 className="section-title">Discover Creators</h2>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user._id} className="user-card">
              <div className="user-card-header">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="user-avatar-large"
                />
                <div className={`online-indicator ${isOnline(user._id) ? 'online' : ''}`}>
                  {isOnline(user._id) ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="user-info">
                <h3 className="user-name">{user.name}</h3>
                <p className="user-email">{user.email}</p>
                {user.bio && <p className="user-bio">{user.bio}</p>}
              </div>
              <div className="user-actions">
                {getConnectionButton(user)}
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="no-users">
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;