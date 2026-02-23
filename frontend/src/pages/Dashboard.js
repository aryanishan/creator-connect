import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';
import './Dashboard.css';

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading assets...</p>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="feed-header">
        <h1>Asset Feed</h1>
        <p>Only public assets are shown here.</p>
      </div>

      {assets.length === 0 ? (
        <div className="empty-feed">
          <h3>No public assets yet</h3>
          <p>Be the first to publish one.</p>
          <Link to="/assets/create" className="create-link">Create Asset</Link>
        </div>
      ) : (
        <div className="asset-grid">
          {assets.map((asset) => (
            <Link to={`/assets/${asset._id}`} key={asset._id} className="asset-card">
              <div className="asset-media-wrap">
                {asset.media?.[0]?.mediaType === 'video' ? (
                  <video src={asset.media[0].url} className="asset-media" muted />
                ) : (
                  <img
                    src={asset.media?.[0]?.url || 'https://via.placeholder.com/600x340'}
                    alt={asset.title}
                    className="asset-media"
                  />
                )}
                {asset.media?.length > 1 && (
                  <span className="media-count">+{asset.media.length - 1}</span>
                )}
              </div>

              <div className="asset-body">
                <h3>{asset.title}</h3>
                <p>{asset.description || 'No description provided.'}</p>

                <div className="asset-owner">
                  <img src={asset.owner?.avatar} alt={asset.owner?.name} />
                  <span>{asset.owner?.name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
