import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import { FiMessageCircle, FiUserMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../config/api';
import './Connections.css';

const Connections = () => {
  const { user, updateUser } = useAuth();
  const { isOnline } = useSocket();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await api.get('/users');
      const connectedUsers = response.data.filter(u => u.connectionStatus === 'connected');
      setConnections(connectedUsers);
    } catch (error) {
      toast.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading connections...</p>
      </div>
    );
  }

  return (
    <div className="connections-page fade-in">
      <div className="connections-header">
        <h1 className="page-title">Your Connections</h1>
        <p className="page-subtitle">
          You have {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="no-connections">
          <div className="no-connections-content">
            <FiUserMinus className="no-connections-icon" />
            <h3>No Connections Yet</h3>
            <p>Start connecting with other creators from the dashboard</p>
            <Link to="/" className="browse-btn">
              Browse Creators
            </Link>
          </div>
        </div>
      ) : (
        <div className="connections-grid">
          {connections.map((connection) => (
            <div key={connection._id} className="connection-card">
              <div className="connection-card-header">
                <img
                  src={connection.avatar}
                  alt={connection.name}
                  className="connection-avatar"
                />
                <div className={`connection-status ${isOnline(connection._id) ? 'online' : ''}`}>
                  {isOnline(connection._id) ? 'Online' : 'Offline'}
                </div>
              </div>
              <div className="connection-info">
                <h3 className="connection-name">{connection.name}</h3>
                <p className="connection-email">{connection.email}</p>
                {connection.bio && (
                  <p className="connection-bio">{connection.bio}</p>
                )}
              </div>
              <div className="connection-actions">
                <Link
                  to={`/messages/${connection._id}`}
                  className="connection-action message-action"
                >
                  <FiMessageCircle />
                  <span>Message</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;