import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiEdit2, FiSave, FiX, FiCamera, FiGrid, FiFilm, FiRepeat } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../config/api';
import './Profile.css';

const ASSET_TABS = [
  { id: 'public', label: 'Public', icon: FiGrid },
  { id: 'private', label: 'Private', icon: FiFilm },
  { id: 'unlisted', label: 'Unlisted', icon: FiRepeat }
];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || 'https://via.placeholder.com/150'
  });
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [activeAssetTab, setActiveAssetTab] = useState('public');
  const [profileStats, setProfileStats] = useState({
    connections: user?.connections?.length || 0,
    pendingRequests: user?.pendingRequests?.length || 0,
    messagesSent: 0
  });

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      bio: user?.bio || '',
      avatar: user?.avatar || 'https://via.placeholder.com/150'
    });
  }, [user]);

  useEffect(() => {
    fetchMyAssets();
    fetchProfileStats();
  }, []);

  const fetchMyAssets = async () => {
    try {
      setAssetsLoading(true);
      const response = await api.get('/assets/me');
      setAssets(response.data || []);
    } catch (error) {
      toast.error('Failed to load your assets');
    } finally {
      setAssetsLoading(false);
    }
  };

  const fetchProfileStats = async () => {
    try {
      const response = await api.get('/users/profile/stats');
      setProfileStats(response.data);
    } catch (error) {
      setProfileStats({
        connections: user?.connections?.length || 0,
        pendingRequests: user?.pendingRequests?.length || 0,
        messagesSent: 0
      });
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/users/profile', {
        name: formData.name,
        bio: formData.bio
      });
      updateUser(response.data);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      setAvatarUploading(true);
      const response = await api.put('/users/profile/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const avatar = response.data?.avatar;
      if (avatar) {
        setFormData((prev) => ({ ...prev, avatar }));
        updateUser({ avatar });
      }
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setAvatarUploading(false);
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

  const filteredAssets = useMemo(
    () => assets.filter((asset) => asset.visibility === activeAssetTab),
    [assets, activeAssetTab]
  );

  return (
    <div className="profile-page fade-in">
      <section className="ig-profile-hero">
        <div className="ig-avatar-col">
          <div className="ig-avatar-ring">
            <img src={formData.avatar} alt={formData.name} className="ig-avatar" />
          </div>
          <label className={`ig-dp-btn ${avatarUploading ? 'disabled' : ''}`}>
            <FiCamera />
            <span>{avatarUploading ? 'Uploading DP...' : 'Update DP'}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={avatarUploading}
            />
          </label>
        </div>

        <div className="ig-main-col">
          <div className="ig-top-row">
            <h1>{user?.name}</h1>
            {!isEditing && (
              <div className="ig-top-actions">
                <Link to="/assets/create" className="ig-create-btn">
                  <span>Create Asset</span>
                </Link>
                <button className="ig-edit-btn" onClick={() => setIsEditing(true)}>
                  <FiEdit2 />
                  <span>Edit Profile</span>
                </button>
              </div>
            )}
          </div>

          <div className="ig-stats-row">
            <div><strong>{assets.length}</strong><span>assets</span></div>
            <div><strong>{profileStats.connections}</strong><span>connections</span></div>
            <div><strong>{profileStats.pendingRequests}</strong><span>pending</span></div>
            <div><strong>{profileStats.messagesSent}</strong><span>messages</span></div>
          </div>

          <p className="ig-bio">{user?.bio || 'No bio added yet'}</p>
          <p className="ig-meta">{user?.email}</p>
          <p className="ig-meta">Member since {user?.createdAt && new Date(user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p className="ig-meta">
            Status: <span className={`status-badge ${user?.isVerified ? 'verified' : 'unverified'}`}>
              {user?.isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </p>
        </div>
      </section>

      {isEditing && (
        <section className="ig-edit-card">
          <h2>Edit Profile</h2>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength="2"
                maxLength="50"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" value={user?.email} disabled className="email-input" />
            </div>

            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                maxLength="200"
                rows="4"
                disabled={loading}
                className="bio-textarea"
              />
              <p className="bio-counter">{formData.bio.length}/200</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                <FiSave />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button type="button" className="cancel-btn" onClick={handleCancel} disabled={loading}>
                <FiX />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ig-assets-section">
        <div className="ig-tabs" role="tablist" aria-label="Asset visibility tabs">
          {ASSET_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = assets.filter((asset) => asset.visibility === tab.id).length;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeAssetTab === tab.id}
                onClick={() => setActiveAssetTab(tab.id)}
                className={`ig-tab ${activeAssetTab === tab.id ? 'active' : ''}`}
              >
                <Icon />
                <span>{tab.label}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>

        {assetsLoading ? (
          <div className="assets-empty">Loading your assets...</div>
        ) : filteredAssets.length === 0 ? (
          <div className="assets-empty">
            No {activeAssetTab} assets yet. <Link to="/assets/create">Create one now</Link>
          </div>
        ) : (
          <div className="ig-grid">
            {filteredAssets.map((asset) => (
              <Link to={`/assets/${asset._id}`} key={asset._id} className="ig-grid-item">
                {asset.media?.[0]?.mediaType === 'video' ? (
                  <video src={asset.media[0].url} className="ig-media" muted />
                ) : (
                  <img
                    src={asset.media?.[0]?.url || 'https://via.placeholder.com/500x300'}
                    alt={asset.title}
                    className="ig-media"
                  />
                )}
                <div className="ig-overlay">
                  <h3>{asset.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Profile;
