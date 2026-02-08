// frontend/src/pages/PackDetail.jsx - Детальная страница пакета

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './PackDetail.css';

const PackDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [pack, setPack] = useState(null);
  const [habits, setHabits] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPackDetail();
  }, [slug]);

  const fetchPackDetail = async () => {
    try {
      const response = await api.get(`/packs/store/${slug}`);
      const { pack, habits, achievements, progress } = response.data.data;
      setPack(pack);
      setHabits(habits);
      setAchievements(achievements);
      setProgress(progress);
    } catch (error) {
      console.error('Error fetching pack detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (purchasing || pack.is_purchased) return;

    setPurchasing(true);
    try {
      const response = await api.post('/packs/orders/create', {
        pack_id: pack.id,
      });

      const { type, order_id, invoice_url } = response.data.data;

      if (type === 'free') {
        // Бесплатный пакет - перезагружаем данные
        await fetchPackDetail();
        alert('Пакет успешно активирован!');
        navigate('/');
      } else {
        // Платный пакет - открываем Telegram Stars
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openInvoice(invoice_url, (status) => {
            if (status === 'paid') {
              fetchPackDetail();
              alert('Покупка успешна! Привычки добавлены.');
              navigate('/');
            }
          });
        }
      }
    } catch (error) {
      console.error('Error purchasing pack:', error);
      alert(error.response?.data?.error || 'Ошибка при покупке');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="pack-detail-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="pack-not-found">
        <p>Пакет не найден</p>
        <button onClick={() => navigate('/packs')}>
          Вернуться в магазин
        </button>
      </div>
    );
  }

  return (
    <div className="pack-detail">
      {/* Header */}
      <div className="pack-detail-header">
        <button 
          className="back-button"
          onClick={() => navigate('/packs')}
        >
          ← Назад
        </button>
      </div>

      {/* Cover */}
      <div className="pack-cover">
        <img 
          src={pack.cover_image_url} 
          alt={pack.title}
          onError={(e) => {
            e.target.src = '/placeholder-avatar.png';
          }}
        />
        <div className="pack-cover-overlay">
          <h1>{pack.title}</h1>
          <p>{pack.subtitle}</p>
        </div>
      </div>

      {/* Biography */}
      {pack.long_description && (
        <div className="pack-section biography">
          <h2>О персоне</h2>
          <div 
            className="biography-text"
            dangerouslySetInnerHTML={{ __html: pack.long_description }}
          />
        </div>
      )}

      {/* Progress (if purchased) */}
      {pack.is_purchased && progress && (
        <div className="pack-section progress-section">
          <h2>Ваш прогресс</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${(progress.completed_count / progress.total_count) * 100}%` 
              }}
            />
          </div>
          <p className="progress-text">
            {progress.completed_count} из {progress.total_count} привычек выполнено
          </p>
        </div>
      )}

      {/* Habits List */}
      <div className="pack-section habits-section">
        <h2>Привычки ({pack.count_habits})</h2>
        <div className="habits-list">
          {habits.map((habit, index) => (
            <div 
              key={index}
              className={`habit-item ${!pack.is_purchased ? 'locked' : ''}`}
            >
              <div className="habit-icon">
                {pack.is_purchased ? (
                  <span>{habit.category_icon || '📝'}</span>
                ) : (
                  <span>🔒</span>
                )}
              </div>
              <div className="habit-content">
                <div className="habit-title">{habit.goal}</div>
                {pack.is_purchased && (
                  <div className="habit-meta">
                    <span className="habit-category">
                      {habit.category_name}
                    </span>
                    {habit.reminder_time && (
                      <span className="habit-time">
                        🕐 {habit.reminder_time.substring(0, 5)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="pack-section achievements-section">
        <h2>Достижения ({pack.count_achievements})</h2>
        <div className="achievements-list">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`achievement-item ${achievement.is_achieved ? 'achieved' : ''}`}
            >
              <div className="achievement-icon">
                {achievement.is_achieved ? '🏆' : '⚪'}
              </div>
              <div className="achievement-content">
                <div className="achievement-title">
                  {achievement.title}
                </div>
                <div className="achievement-description">
                  {achievement.description}
                </div>
                <div className="achievement-progress">
                  {pack.is_purchased && progress ? (
                    <>
                      {Math.min(progress.completed_count, achievement.required_completions)} / {achievement.required_completions}
                    </>
                  ) : (
                    `Требуется: ${achievement.required_completions}`
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase Button */}
      {!pack.is_purchased && (
        <div className="pack-footer">
          <button 
            className="purchase-button"
            onClick={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              'Обработка...'
            ) : pack.price_stars === 0 ? (
              'Получить бесплатно'
            ) : (
              <>
                Разблокировать за <span className="star-icon">⭐</span> {pack.price_stars}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PackDetail;