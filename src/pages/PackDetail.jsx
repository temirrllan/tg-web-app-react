// frontend/src/pages/PackDetail.jsx - Страница детальной информации о пакете

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import packService from '../services/packService';
import './PackDetail.css';

const PackDetail = ({ slug, onNavigate }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [habits, setHabits] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPackDetail();
  }, [slug]);

  const loadPackDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await packService.getPackDetail(slug);
      
      if (response.success) {
        setPack(response.data.pack);
        setHabits(response.data.habits);
        setAchievements(response.data.achievements);
        setProgress(response.data.progress);
      }
    } catch (err) {
      console.error('Failed to load pack detail:', err);
      setError('Failed to load pack details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!pack || purchasing) return;

    try {
      setPurchasing(true);
      const response = await packService.createOrder(pack.id);

      if (response.success) {
        if (response.data.type === 'free') {
          // Бесплатный пакет - перезагружаем страницу
          alert('Pack added to your collection! 🎉');
          loadPackDetail();
        } else if (response.data.type === 'paid') {
          // Платный пакет - открываем Telegram Stars invoice
          const invoiceUrl = response.data.invoice_url;
          
          if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.openInvoice(invoiceUrl, (status) => {
              if (status === 'paid') {
                alert('Payment successful! Pack added to your collection! 🎉');
                loadPackDetail();
              } else if (status === 'cancelled') {
                alert('Payment cancelled');
              } else if (status === 'failed') {
                alert('Payment failed. Please try again.');
              }
            });
          } else {
            // Fallback для не-Telegram окружения
            window.open(invoiceUrl, '_blank');
          }
        }
      }
    } catch (err) {
      console.error('Purchase error:', err);
      alert(err.response?.data?.error || 'Failed to purchase pack. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="pack-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading pack...</p>
        </div>
      </div>
    );
  }

  if (error || !pack) {
    return (
      <div className="pack-detail-container">
        <div className="error-message">
          <p>{error || 'Pack not found'}</p>
          <button onClick={() => onNavigate('packs')} className="back-button">
    ← Back
  </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pack-detail-container">
      {/* Header */}
      <div className="pack-detail-header">
        <button onClick={() => navigate('/packs')} className="back-button">
          ← Back
        </button>

        {pack.cover_image_url && (
          <div className="pack-detail-cover">
            <img src={pack.cover_image_url} alt={pack.title} />
          </div>
        )}

        <h1 className="pack-detail-title">{pack.title}</h1>
        
        {pack.subtitle && (
          <p className="pack-detail-subtitle">{pack.subtitle}</p>
        )}

        <div className="pack-detail-stats">
          <div className="stat">
            <span className="stat-value">{pack.count_habits}</span>
            <span className="stat-label">Habits</span>
          </div>
          <div className="stat">
            <span className="stat-value">{pack.count_achievements}</span>
            <span className="stat-label">Achievements</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {pack.long_description && (
        <div className="pack-description">
          <h2>About this pack</h2>
          <div dangerouslySetInnerHTML={{ __html: pack.long_description }} />
        </div>
      )}

      {/* Habits List */}
      <div className="pack-habits">
        <h2>
          {pack.is_purchased ? 'Your Habits' : 'Included Habits'}
        </h2>
        
        <div className="habits-list">
          {habits.map((habit, index) => (
            <div key={index} className="habit-item">
              {habit.category_icon && (
                <span className="habit-icon">{habit.category_icon}</span>
              )}
              <div className="habit-info">
                {pack.is_purchased ? (
                  <>
                    <h4>{habit.title}</h4>
                    <p>{habit.goal}</p>
                    {habit.reminder_time && (
                      <span className="habit-time">⏰ {habit.reminder_time}</span>
                    )}
                  </>
                ) : (
                  <p className="habit-goal-preview">{habit.goal}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="pack-achievements">
          <h2>Achievements</h2>
          
          <div className="achievements-list">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className={`achievement-item ${achievement.is_achieved ? 'achieved' : 'locked'}`}
              >
                <div className="achievement-icon">
                  {achievement.is_achieved ? '🏆' : '🔒'}
                </div>
                <div className="achievement-info">
                  <h4>{achievement.title}</h4>
                  <p>{achievement.description}</p>
                  <span className="achievement-requirement">
                    {achievement.required_completions} completions required
                  </span>
                  {achievement.is_achieved && achievement.achieved_at && (
                    <span className="achievement-date">
                      Unlocked: {new Date(achievement.achieved_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress (if purchased) */}
      {pack.is_purchased && progress && (
        <div className="pack-progress">
          <h2>Your Progress</h2>
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="progress-value">
                {progress.completed_count}/{progress.total_count}
              </span>
              <span className="progress-label">Habits Completed (Last 30 days)</span>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Button */}
      {!pack.is_purchased && (
        <div className="pack-purchase-section">
          <button 
            onClick={handlePurchase}
            disabled={purchasing}
            className="purchase-button"
          >
            {purchasing ? (
              <>
                <span className="spinner-small"></span>
                Processing...
              </>
            ) : pack.price_stars === 0 ? (
              <>
                <span>Get for FREE</span>
                <span className="button-icon">📦</span>
              </>
            ) : (
              <>
                <span>Purchase for {pack.price_stars} ⭐</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PackDetail;