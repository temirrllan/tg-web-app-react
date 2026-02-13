// frontend/src/pages/Achievements.jsx - Страница достижений

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import packService from '../services/packService';
import './Achievements.css';

const Achievements = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [packs, setPacks] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryResponse, recentResponse] = await Promise.all([
        packService.getAchievementsSummary(),
        packService.getRecentAchievements(5)
      ]);

      if (summaryResponse.success) {
        setSummary(summaryResponse.data.summary);
        setPacks(summaryResponse.data.packs);
      }

      if (recentResponse.success) {
        setRecentAchievements(recentResponse.data);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (unlocked, total) => {
    if (total === 0) return 0;
    return Math.round((unlocked / total) * 100);
  };

  if (loading) {
    return (
      <div className="achievements-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadAchievements} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      {/* Header */}
      <header className="achievements-header">
        <h1>🏆 Achievements</h1>
        {summary && (
          <div className="overall-progress">
            <div className="progress-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${calculateProgress(summary.total_unlocked_achievements, summary.total_possible_achievements)}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {calculateProgress(summary.total_unlocked_achievements, summary.total_possible_achievements)}%
                </text>
              </svg>
            </div>
            <div className="progress-stats">
              <p className="stat-value">{summary.total_unlocked_achievements}/{summary.total_possible_achievements}</p>
              <p className="stat-label">Total Achievements</p>
            </div>
          </div>
        )}
      </header>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <section className="recent-achievements">
          <h2>🆕 Recently Unlocked</h2>
          <div className="recent-list">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="recent-achievement-card">
                <div className="achievement-badge">🏆</div>
                <div className="achievement-content">
                  <h4>{achievement.title}</h4>
                  <p className="achievement-pack">{achievement.pack_title}</p>
                  <p className="achievement-date">
                    {new Date(achievement.achieved_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Packs with Achievements */}
      <section className="packs-achievements">
        <h2>📦 Your Packs</h2>
        
        {packs.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📦</p>
            <p className="empty-text">No packs yet</p>
            <button 
    onClick={() => onNavigate('packs')}
    className="browse-button"
  >
    Browse Pack Store
  </button>
          </div>
        ) : (
          <div className="packs-list">
            {packs.map((pack) => (
              <div 
                key={pack.id} 
                className="pack-achievement-card"
                onClick={() => onNavigate('pack-detail', { slug: pack.slug })}
              >
                {pack.cover_image_url && (
                  <div className="pack-thumb">
                    <img src={pack.cover_image_url} alt={pack.title} />
                  </div>
                )}
                
                <div className="pack-info">
                  <h3>{pack.title}</h3>
                  
                  <div className="pack-achievement-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${calculateProgress(pack.unlocked_achievements, pack.total_achievements)}%` 
                        }}
                      />
                    </div>
                    <span className="progress-text">
                      {pack.unlocked_achievements}/{pack.total_achievements} achievements
                    </span>
                  </div>
                </div>

                <div className="pack-badge">
                  {pack.unlocked_achievements === pack.total_achievements && pack.total_achievements > 0 ? (
                    <span className="completed-badge">✓</span>
                  ) : (
                    <span className="in-progress-badge">
                      {calculateProgress(pack.unlocked_achievements, pack.total_achievements)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Achievements;