import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { packService } from '../services/packs';
import './PackStore.css';

const PackStore = ({ onClose }) => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all'); // all, purchased

  useNavigation(onClose);

  useEffect(() => {
    loadPacks();
  }, [selectedTab]);

  const loadPacks = async () => {
    try {
      setLoading(true);
      
      if (selectedTab === 'all') {
        const data = await packService.getStorePacks();
        setPacks(data.packs);
      } else {
        const data = await packService.getMyPacks();
        setPacks(data.packs);
      }
    } catch (error) {
      console.error('Failed to load packs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pack-store">
      <div className="pack-store__header">
        <h1>🎁 Habit Packs</h1>
        
        <div className="pack-store__tabs">
          <button
            className={`tab ${selectedTab === 'all' ? 'tab--active' : ''}`}
            onClick={() => setSelectedTab('all')}
          >
            All Packs
          </button>
          <button
            className={`tab ${selectedTab === 'purchased' ? 'tab--active' : ''}`}
            onClick={() => setSelectedTab('purchased')}
          >
            My Packs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="pack-store__loading">Loading...</div>
      ) : (
        <div className="pack-store__grid">
          {packs.map(pack => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </div>
      )}
    </div>
  );
};

const PackCard = ({ pack }) => {
  return (
    <div className="pack-card">
      <img 
        src={pack.cover_image_url || '/placeholder-pack.png'} 
        alt={pack.title}
        className="pack-card__image"
      />
      
      <div className="pack-card__content">
        <h3 className="pack-card__title">{pack.title}</h3>
        <p className="pack-card__author">by {pack.author_name}</p>
        <p className="pack-card__description">{pack.short_description}</p>
        
        <div className="pack-card__footer">
          <span className="pack-card__count">
            {pack.count_habits} habits
          </span>
          <span className="pack-card__price">
            {pack.price_stars === 0 ? 'FREE' : `${pack.price_stars} ⭐`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PackStore;