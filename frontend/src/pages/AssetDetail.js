import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';
import './AssetDetail.css';

const AssetDetail = () => {
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  const fetchAsset = async () => {
    try {
      const response = await api.get(`/assets/${assetId}`);
      setAsset(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch asset');
    } finally {
      setLoading(false);
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
        <h1>{asset.title}</h1>
        <p className="asset-detail-description">{asset.description || 'No description provided.'}</p>
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
