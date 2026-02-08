// frontend/src/pages/PackStore.jsx - Магазин пакетов

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PackStore.css';

const PackStore = () => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      const response = await api.get('/packs/store');
      setPacks(response.data.data);
    } catch (error) {
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePackClick = (slug) => {
    navigate(`/packs/${slug}`);
  };

  if (loading) {
    return (
      <div className="pack-store-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pack-store">
      <div className="pack-store-header">
        <button 
          className="back-button"
          onClick={() => navigate('/profile')}
        >
          ← Назад
        </button>
        <h1>Специальные привычки</h1>
        <p className="subtitle">
          Внедрите привычки великих людей в свою жизнь
        </p>
      </div>

      <div className="packs-grid">
        {packs.map((pack) => (
          <div 
            key={pack.id}
            className={`pack-card ${pack.is_purchased ? 'purchased' : ''}`}
            onClick={() => handlePackClick(pack.slug)}
          >
            <div className="pack-card-image">
              <img 
                src={pack.cover_image_url} 
                alt={pack.title}
                onError={(e) => {
                  e.target.src = '/placeholder-avatar.png';
                }}
              />
              {pack.is_purchased && (
                <div className="purchased-badge">
                  <span>✓</span>
                </div>
              )}
            </div>

            <div className="pack-card-content">
              <h3>{pack.title}</h3>
              <p className="pack-subtitle">{pack.subtitle}</p>
              
              {pack.short_description && (
                <p className="pack-description">
                  {pack.short_description}
                </p>
              )}

              <div className="pack-stats">
                <span className="stat">
                  <span className="stat-icon">📝</span>
                  {pack.count_habits} привычек
                </span>
                <span className="stat">
                  <span className="stat-icon">🏆</span>
                  {pack.count_achievements} достижений
                </span>
              </div>

              <div className="pack-card-footer">
                {pack.is_purchased ? (
                  <button className="pack-button purchased">
                    Открыто
                  </button>
                ) : (
                  <button className="pack-button">
                    {pack.price_stars === 0 ? (
                      'Получить бесплатно'
                    ) : (
                      <>
                        <span className="star-icon">⭐</span>
                        {pack.price_stars}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {packs.length === 0 && (
        <div className="empty-state">
          <p>Пакеты скоро появятся</p>
        </div>
      )}
    </div>
  );
};

export default PackStore;