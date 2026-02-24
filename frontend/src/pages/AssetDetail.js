import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import './AssetDetail.css';

const AssetDetail = () => {
  const navigate = useNavigate();
  const { assetId } = useParams();
  const { user } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    visibility: 'public'
  });

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const response = await api.get(`/assets/${assetId}`);
      setAsset(response.data);
      setEditData({
        title: response.data?.title || '',
        description: response.data?.description || '',
        visibility: response.data?.visibility || 'public'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch asset');
    } finally {
      setLoading(false);
    }
  };

  const ownerId = asset?.owner?._id || asset?.owner;
  const currentUserId = user?._id || user?.id;
  const isOwner = Boolean(ownerId && currentUserId && ownerId.toString() === currentUserId.toString());

  const handleChange = (e) => {
    setEditData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      setSaving(true);
      const response = await api.put(`/assets/${assetId}`, {
        title: editData.title,
        description: editData.description,
        visibility: editData.visibility
      });
      setAsset(response.data);
      setIsEditing(false);
      toast.success('Asset updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this asset permanently?');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await api.delete(`/assets/${assetId}`);
      toast.success('Asset deleted');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading asset...</p>
      </div>
    );
  }

  if (!asset) {
    return <div className="asset-detail-empty">Asset not found.</div>;
  }

  return (
    <div className="asset-detail-page fade-in">
      <div className="asset-detail-card">
        {isOwner && (
          <div className="asset-owner-actions">
            {!isEditing ? (
              <>
                <button type="button" className="asset-action-btn edit" onClick={() => setIsEditing(true)}>
                  <FiEdit2 />
                  <span>Edit</span>
                </button>
                <button type="button" className="asset-action-btn delete" onClick={handleDelete} disabled={deleting}>
                  <FiTrash2 />
                  <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                </button>
              </>
            ) : (
              <button type="button" className="asset-action-btn cancel" onClick={() => setIsEditing(false)}>
                <FiX />
                <span>Cancel</span>
              </button>
            )}
          </div>
        )}

        {isEditing ? (
          <form className="asset-edit-form" onSubmit={handleUpdate}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              value={editData.title}
              onChange={handleChange}
              maxLength={120}
              required
              disabled={saving}
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={editData.description}
              onChange={handleChange}
              maxLength={1000}
              rows={4}
              disabled={saving}
            />

            <label htmlFor="visibility">Visibility</label>
            <select
              id="visibility"
              name="visibility"
              value={editData.visibility}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>

            <button type="submit" className="asset-save-btn" disabled={saving}>
              <FiCheck />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        ) : (
          <>
            <h1>{asset.title}</h1>
            <p className="asset-detail-description">{asset.description || 'No description provided.'}</p>
          </>
        )}

        <div className="asset-detail-meta">
          <img src={asset.owner?.avatar} alt={asset.owner?.name} />
          <span>{asset.owner?.name}</span>
          <small>{asset.visibility}</small>
        </div>

        <div className="asset-detail-media-grid">
          {asset.media?.map((item, index) => (
            <div key={`${item.url}-${index}`} className="asset-detail-media-item">
              {item.mediaType === 'video' ? (
                <video src={item.url} controls />
              ) : (
                <img src={item.url} alt={`${asset.title}-${index + 1}`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssetDetail;
