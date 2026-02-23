import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiEdit2, FiSave, FiX, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../config/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || 'https://via.placeholder.com/150'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/users/profile', formData);
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      avatar: user?.avatar || 'https://via.placeholder.com/150'
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page fade-in">
      <div className="profile-header">
        <h1 className="page-title">Your Profile</h1>
        {!isEditing && (
          <button
            className="edit-profile-btn"
            onClick={() => setIsEditing(true)}
          >
            <FiEdit2 />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      <div className="profile-card">
        <div className="profile-avatar-section">
          <div className="avatar-container">
            <img
              src={formData.avatar}
              alt={formData.name}
              className="profile-avatar"
            />
            {isEditing && (
              <div className="avatar-overlay">
                <FiCamera className="camera-icon" />
                <span>Change Photo</span>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                minLength="2"
                maxLength="50"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={user?.email}
                disabled
                className="email-input"
              />
              <p className="email-note">Email cannot be changed</p>
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell others about yourself..."
                maxLength="200"
                rows="4"
                disabled={loading}
                className="bio-textarea"
              />
              <p className="bio-counter">{formData.bio.length}/200</p>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >
                <FiSave />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
                disabled={loading}
              >
                <FiX />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-group">
              <label>Full Name</label>
              <p className="info-value">{user?.name}</p>
            </div>

            <div className="info-group">
              <label>Email</label>
              <p className="info-value">{user?.email}</p>
            </div>

            <div className="info-group">
              <label>Bio</label>
              <p className="info-value bio-value">
                {user?.bio || 'No bio added yet'}
              </p>
            </div>

            <div className="info-group">
              <label>Member Since</label>
              <p className="info-value">
                {user?.createdAt && new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="info-group">
              <label>Account Status</label>
              <p className="info-value">
                <span className={`status-badge ${user?.isVerified ? 'verified' : 'unverified'}`}>
                  {user?.isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <h3 className="stat-number">{user?.connections?.length || 0}</h3>
          <p className="stat-label">Connections</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{user?.pendingRequests?.length || 0}</h3>
          <p className="stat-label">Pending Requests</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">0</h3>
          <p className="stat-label">Messages Sent</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;