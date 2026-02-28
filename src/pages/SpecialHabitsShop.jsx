// src/pages/SpecialHabitsShop.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { specialHabitsService } from '../services/specialHabits';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import Loader from '../components/common/Loader';
import './SpecialHabitsShop.css';

const FILTERS = ['all', 'paid', 'free'];

const SpecialHabitsShop = ({ onClose, onPackSelect }) => {
  useTelegramTheme();
  useNavigation(onClose);

  const [packs, setPacks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchPacks = useCallback(async (currentFilter, currentSearch) => {
    setLoading(true);
    try {
      const data = await specialHabitsService.getPacks({ filter: currentFilter, search: currentSearch });
      setPacks(data.packs || []);
    } catch (err) {
      console.error('Failed to load packs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPacks(filter, '');
  }, [filter]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(searchTimeout);
    const t = setTimeout(() => fetchPacks(filter, val), 350);
    setSearchTimeout(t);
  };

  return (
    <div className="shop">

      {/* Search */}
      <div className="shop__search-wrap">
        <span className="shop__search-icon">🔍</span>
        <input
          className="shop__search"
          type="text"
          placeholder="Search celebrity or habit..."
          value={search}
          onChange={handleSearchChange}
        />
        {search && (
          <button className="shop__search-clear" onClick={() => { setSearch(''); fetchPacks(filter, ''); }}>×</button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="shop__filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`shop__filter-tab ${filter === f ? 'shop__filter-tab--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : 'Free'}
          </button>
        ))}
      </div>

      {/* Pack grid */}
      {loading ? (
        <div className="shop__loader"><Loader /></div>
      ) : packs.length === 0 ? (
        <div className="shop__empty">
          <p className="shop__empty-icon">📦</p>
          <p className="shop__empty-text">No packs found</p>
        </div>
      ) : (
        <div className="shop__grid">
          {packs.map(pack => (
            <PackCard key={pack.id} pack={pack} onClick={() => onPackSelect(pack)} />
          ))}
        </div>
      )}
    </div>
  );
};

const PackCard = ({ pack, onClick }) => {
  const isFree = pack.price_stars === 0;
  const hasDiscount = pack.original_price_stars && pack.original_price_stars > pack.price_stars;

  return (
    <button className={`pack-card ${pack.is_purchased ? 'pack-card--owned' : ''}`} onClick={onClick}>
      <div className="pack-card__image-wrap">
        {pack.photo_url ? (
          <img src={pack.photo_url} alt={pack.name} className="pack-card__image" />
        ) : (
          <div className="pack-card__image-placeholder">✨</div>
        )}
        {pack.is_purchased && (
          <div className="pack-card__owned-badge">✓ Owned</div>
        )}
      </div>

      <div className="pack-card__info">
        <h3 className="pack-card__name">{pack.name}</h3>
        <p className="pack-card__desc">{pack.short_description}</p>

        <div className="pack-card__meta">
          <span className="pack-card__count">📋 {pack.habit_count} habits</span>
        </div>

        <div className="pack-card__price">
          {isFree ? (
            <span className="pack-card__price-free">FREE</span>
          ) : (
            <>
              {hasDiscount && (
                <span className="pack-card__price-original">⭐ {pack.original_price_stars}</span>
              )}
              <span className="pack-card__price-value">⭐ {pack.price_stars}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default SpecialHabitsShop;
