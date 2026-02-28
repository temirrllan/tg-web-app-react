// src/pages/SpecialHabitsShop.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { specialHabitsService } from '../services/specialHabits';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import Loader from '../components/common/Loader';
import './SpecialHabitsShop.css';

const FILTERS = ['all', 'paid', 'free'];

// Fallback pastel palette — same order as the color swatches in admin
const FALLBACK_COLORS = [
  '#c8e6c9', // soft green
  '#ffccbc', // salmon
  '#b2ebf2', // teal
  '#d1c4e9', // lavender
  '#fff9c4', // yellow
  '#f8bbd0', // pink
  '#dcedc8', // lime
  '#ffe0b2', // orange
  '#e1f5fe', // light blue
  '#fce4ec', // rose
];

const getPackBgColor = (pack) => {
  if (pack.bg_color) return pack.bg_color;
  return FALLBACK_COLORS[(pack.id - 1) % FALLBACK_COLORS.length];
};

const SpecialHabitsShop = ({ onClose, onPackSelect }) => {
  useTelegramTheme();
  useNavigation(onClose);

  const [packs, setPacks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [searchTimer, setSearchTimer] = useState(null);

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
    clearTimeout(searchTimer);
    const t = setTimeout(() => fetchPacks(filter, val), 350);
    setSearchTimer(t);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchPacks(filter, '');
  };

  return (
    <div className="shop">

      {/* Page title */}
      <div className="shop__header">
        <h1 className="shop__title">Special Habits</h1>
      </div>

      {/* Search bar */}
      <div className="shop__search-wrap">
        <svg className="shop__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#aaa" strokeWidth="2.2"/>
          <path d="m21 21-4.35-4.35" stroke="#aaa" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        <input
          className="shop__search"
          type="text"
          placeholder="Search"
          value={search}
          onChange={handleSearchChange}
        />
        {search && (
          <button className="shop__search-clear" onClick={handleClearSearch}>×</button>
        )}
      </div>

      {/* Filter pills */}
      <div className="shop__filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`shop__filter-pill ${filter === f ? 'shop__filter-pill--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'paid' ? 'Paid' : 'Free'}
          </button>
        ))}
      </div>

      {/* Content */}
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
  const isFree      = pack.price_stars === 0;
  const hasDiscount = pack.original_price_stars && pack.original_price_stars > pack.price_stars;
  const bgColor     = getPackBgColor(pack);

  return (
    <button
      className={`pack-card ${pack.is_purchased ? 'pack-card--owned' : ''}`}
      onClick={onClick}
    >
      {/* Colored image area */}
      <div className="pack-card__img-wrap" style={{ background: bgColor }}>
        {pack.photo_url ? (
          <img src={pack.photo_url} alt={pack.name} className="pack-card__img" />
        ) : (
          <div className="pack-card__img-placeholder">✨</div>
        )}
        {pack.is_purchased && (
          <span className="pack-card__owned-badge">✓</span>
        )}
      </div>

      {/* White info area */}
      <div className="pack-card__info">
        <p className="pack-card__name">{pack.name}</p>
        <p className="pack-card__desc">{pack.short_description}</p>

        <div className="pack-card__price-row">
          {isFree ? (
            <span className="pack-card__price-free">FREE</span>
          ) : (
            <>
              {hasDiscount && (
                <span className="pack-card__price-old">$ {pack.original_price_stars}</span>
              )}
              <span className="pack-card__price-val">$ {pack.price_stars}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
};

export default SpecialHabitsShop;
