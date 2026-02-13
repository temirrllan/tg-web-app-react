// frontend/src/pages/PackStore.jsx - Страница магазина пакетов

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import packService from '../services/packService';
import './PackStore.css';

const PackStore = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await packService.getStorePacks();
      
      if (response.success) {
        setPacks(response.data);
      }
    } catch (err) {
      console.error('Failed to load packs:', err);
      setError('Failed to load packs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePackClick = (pack) => {
    onNavigate('pack-detail', { slug: pack.slug });
  };

  if (loading) {
    return (
      <div className="pack-store-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading packs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pack-store-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadPacks} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pack-store-container">
      <header className="pack-store-header">
        <h1>📦 Habit Packs</h1>
        <p className="subtitle">Ready-made habit collections from experts</p>
      </header>

      <div className="packs-grid">
        {packs.map((pack) => (
          <div 
            key={pack.id} 
            className={`pack-card ${pack.is_purchased ? 'purchased' : ''}`}
            onClick={() => handlePackClick(pack)}
          >
            {pack.cover_image_url && (
              <div className="pack-cover">
                <img src={pack.cover_image_url} alt={pack.title} />
              </div>
            )}

            <div className="pack-content">
              <h3 className="pack-title">{pack.title}</h3>
              
              {pack.subtitle && (
                <p className="pack-subtitle">{pack.subtitle}</p>
              )}

              <div className="pack-stats">
                <div className="stat">
                  <span className="stat-icon">✅</span>
                  <span className="stat-value">{pack.count_habits} habits</span>
                </div>
                <div className="stat">
                  <span className="stat-icon">🏆</span>
                  <span className="stat-value">{pack.count_achievements} achievements</span>
                </div>
              </div>

              <div className="pack-footer">
                {pack.is_purchased ? (
                  <div className="purchased-badge">
                    <span className="badge-icon">✓</span>
                    <span>Owned</span>
                  </div>
                ) : (
                  <div className="pack-price">
                    {pack.price_stars === 0 ? (
                      <span className="free-badge">FREE</span>
                    ) : (
                      <>
                        <span className="price-value">{pack.price_stars}</span>
                        <span className="price-currency">⭐</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {packs.length === 0 && (
        <div className="empty-state">
          <p className="empty-icon">📦</p>
          <p className="empty-text">No packs available yet</p>
          <p className="empty-subtext">Check back soon for new habit collections!</p>
        </div>
      )}
    </div>
  );
};

export default PackStore;