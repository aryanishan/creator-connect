import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link, useSearchParams } from 'react-router-dom';
import { FiMessageCircle, FiUserPlus, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../config/api';
import './Connections.css';

const Connections = () => {
  const { isOnline } = useSocket();
  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').trim();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers(searchTerm);
  }, [searchTerm]);

  const fetchUsers = async (search = '') => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        params: search ? { search } : {}
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await api.post(`/users/connect/${userId}`);
      toast.success('Connection request sent');
      fetchUsers(searchTerm);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to connect');
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await api.put(`/users/accept/${userId}`);
      toast.success('Connection accepted');
      fetchUsers(searchTerm);
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await api.put(`/users/reject/${userId}`);
      toast.success('Request rejected');
      fetchUsers(searchTerm);
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const connectedUsers = users.filter((u) => u.connectionStatus === 'connected');

  const getAction = (user) => {
    switch (user.connectionStatus) {
      case 'connected':
        return (
          <Link to={`/messages/${user._id}`} className="action-btn message-btn">
            <FiMessageCircle />
            <span>Message</span>
          </Link>
        );
      case 'pending':
        return (
          <button className="action-btn pending-btn" disabled>
            <FiUserPlus />
            <span>Pending</span>
          </button>
        );
      case 'received':
        return (
          <div className="request-actions">
            <button className="icon-btn accept-btn" onClick={() => handleAcceptRequest(user._id)}>
              <FiCheck />
            </button>
            <button className="icon-btn reject-btn" onClick={() => handleRejectRequest(user._id)}>
              <FiX />
            </button>
          </div>
        );
      default:
        return (
          <button className="action-btn connect-btn" onClick={() => handleConnect(user._id)}>
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
        <p>Loading people...</p>
      </div>
    );
  }

  return (
    <div className="connections-page fade-in">
      <h1 className="connections-title">Connections</h1>
      {searchTerm && <p className="connections-search-tag">Showing results for "{searchTerm}"</p>}

      <div className="connections-layout">
        <section className="panel">
          <div className="panel-head">
            <h2>Connected People</h2>
            <span>{connectedUsers.length}</span>
          </div>

          {connectedUsers.length === 0 ? (
            <p className="panel-empty">No connected people yet.</p>
          ) : (
            <div className="people-list">
              {connectedUsers.map((person) => (
                <article key={person._id} className="person-card">
                  <img src={person.avatar} alt={person.name} className="avatar" />
                  <div className="person-meta">
                    <h3>{person.name}</h3>
                    <p>{person.email}</p>
                    <small className={isOnline(person._id) ? 'online' : ''}>
                      {isOnline(person._id) ? 'Online' : 'Offline'}
                    </small>
                  </div>
                  {getAction(person)}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>All People</h2>
            <span>{users.length}</span>
          </div>

          <div className="people-list">
            {users.map((person) => (
              <article key={person._id} className="person-card">
                <img src={person.avatar} alt={person.name} className="avatar" />
                <div className="person-meta">
                  <h3>{person.name}</h3>
                  <p>{person.email}</p>
                  {person.bio && <small>{person.bio}</small>}
                </div>
                {getAction(person)}
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Connections;
