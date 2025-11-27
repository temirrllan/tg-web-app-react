import React, { useState, useEffect } from 'react';
import cacheService from '../services/cacheService';

const CacheDebug = () => {
  const [stats, setStats] = useState({ memorySize: 0, localStorageKeys: 0 });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    setStats(cacheService.getStats());
  };

  const handleClearCache = () => {
    if (window.confirm('Очистить весь кэш?')) {
      cacheService.clear();
      updateStats();
      alert('Кэш очищен!');
    }
  };

  const handleCleanOldCache = () => {
    cacheService.cleanOldCache();
    updateStats();
    alert('Старый кэш удалён!');
  };

  // Показываем только в development режиме
  if (window.location.hostname !== 'localhost') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: expanded ? '0' : '-140px',
      left: '0',
      right: '0',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#00ff00',
      padding: '12px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      transition: 'bottom 0.3s ease',
      borderTop: '2px solid #00ff00'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          position: 'absolute',
          top: '-30px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.9)',
          color: '#00ff00',
          border: '1px solid #00ff00',
          borderRadius: '4px 4px 0 0',
          padding: '4px 12px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '11px'
        }}
      >
        🔍 Cache Debug {expanded ? '▼' : '▲'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ marginBottom: '4px' }}>
            💾 Memory Cache: <strong>{stats.memorySize}</strong> entries
          </div>
          <div>
            💿 LocalStorage: <strong>{stats.localStorageKeys}</strong> entries
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCleanOldCache}
            style={{
              background: '#ff9500',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            🧹 Clean Old
          </button>
          <button
            onClick={handleClearCache}
            style={{
              background: '#ff3b30',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '8px',
        padding: '8px',
        background: 'rgba(0, 255, 0, 0.1)',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        ℹ️ Cache speeds up navigation by storing API responses. 
        Data is automatically refreshed based on TTL settings.
      </div>
    </div>
  );
};

export default CacheDebug;