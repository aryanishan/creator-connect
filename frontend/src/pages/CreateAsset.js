import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';
import './CreateAsset.css';

const CreateAsset = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (files.length === 0) {
      toast.error('Upload at least one image or video');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('visibility', visibility);
    files.forEach((file) => formData.append('media', file));

    try {
      setLoading(true);
      const response = await api.post('/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const createdAsset = response.data;
      toast.success('Asset created successfully');

      if (createdAsset.visibility === 'unlisted') {
        const shareLink = `${window.location.origin}/assets/${createdAsset._id}`;
        await navigator.clipboard.writeText(shareLink);
        toast.success('Unlisted link copied to clipboard');
      }

      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-asset-page fade-in">
      <div className="create-asset-card">
        <h1>Create Asset</h1>
        <p>Upload images/videos and choose who can view this asset.</p>

        <form onSubmit={handleSubmit} className="create-asset-form">
          <label>
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Asset title"
              maxLength={120}
              required
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this asset about?"
              maxLength={1000}
              rows={5}
            />
          </label>

          <label>
            <span>Visibility</span>
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="public">Public (shown on home page)</option>
              <option value="private">Private (only you can access directly)</option>
              <option value="unlisted">Unlisted (viewable only via direct link)</option>
            </select>
          </label>

          <label>
            <span>Media Files (images/videos)</span>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/*"
              multiple
              required
            />
          </label>

          {files.length > 0 && (
            <div className="selected-files">
              <strong>{files.length}</strong> file(s) selected
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Asset'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAsset;
