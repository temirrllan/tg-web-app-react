// hooks/useDeepLink.js - Новый хук для обработки deep links

import { useEffect, useState } from 'react';
import { useTelegram } from './useTelegram';
import { habitService } from '../services/habits';

export const useDeepLink = (onHabitJoined) => {
  const { tg } = useTelegram();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (!tg) {
        console.log('⚠️ Telegram WebApp not initialized');
        return;
      }

      try {
        // Получаем start параметр из Telegram WebApp
        const startParam = tg.initDataUnsafe?.start_parameter;
        
        console.log('🔗 Deep link check:', {
          startParam,
          initDataUnsafe: tg.initDataUnsafe
        });

        if (!startParam) {
          console.log('ℹ️ No start parameter found');
          return;
        }

        // Проверяем, это ли приглашение в привычку
        if (startParam.startsWith('join_')) {
          const shareCode = startParam.replace('join_', '');
          console.log('🎯 Join habit request detected:', shareCode);

          // Проверяем, не обрабатывали ли мы уже эту ссылку
          const processedKey = `processed_join_${shareCode}`;
          if (localStorage.getItem(processedKey)) {
            console.log('✅ This link was already processed');
            return;
          }

          setProcessing(true);
          setError(null);

          try {
            console.log('📤 Sending join request to API...');
            const result = await habitService.joinHabit(shareCode);

            if (result.success) {
              console.log('✅ Successfully joined habit:', result.habit);

              // Сохраняем, что мы обработали эту ссылку
              localStorage.setItem(processedKey, Date.now().toString());

              // Показываем уведомление пользователю
              if (tg.showAlert) {
                tg.showAlert(
                  `✅ You have successfully joined the habit: "${result.habit.title}"!`
                );
              }

              // Вызываем callback если есть
              if (onHabitJoined) {
                onHabitJoined(result.habit);
              }

              // Очищаем URL параметры, чтобы при перезагрузке не обрабатывать снова
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            } else {
              throw new Error(result.error || 'Failed to join habit');
            }
          } catch (err) {
            console.error('❌ Failed to join habit:', err);
            setError(err.message);

            if (tg.showAlert) {
              tg.showAlert(
                `❌ Failed to join habit: ${err.message}\n\nPlease try again or contact support.`
              );
            }
          } finally {
            setProcessing(false);
          }
        } else {
          console.log('ℹ️ Start parameter is not a join request:', startParam);
        }
      } catch (err) {
        console.error('❌ Deep link handler error:', err);
        setError(err.message);
        setProcessing(false);
      }
    };

    // Обрабатываем deep link при монтировании компонента
    handleDeepLink();
  }, [tg, onHabitJoined]);

  return { processing, error };
};


// services/habits.js - Добавляем метод joinHabit

// Добавьте этот метод в ваш habitService:

export const habitService = {
  // ... существующие методы ...

  async joinHabit(shareCode) {
    console.log('🔗 Joining habit with code:', shareCode);
    
    try {
      const response = await fetch(`${API_URL}/habits/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': window.Telegram?.WebApp?.initData || '',
          'x-user-id': localStorage.getItem('user_id') || ''
        },
        body: JSON.stringify({ shareCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join habit');
      }

      console.log('✅ Join habit response:', data);
      return data;
    } catch (error) {
      console.error('❌ Join habit error:', error);
      throw error;
    }
  },

  async createShareLink(habitId) {
    console.log('📤 Creating share link for habit:', habitId);
    
    try {
      const response = await fetch(`${API_URL}/habits/${habitId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': window.Telegram?.WebApp?.initData || '',
          'x-user-id': localStorage.getItem('user_id') || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create share link');
      }

      console.log('✅ Share link created:', data);
      return data;
    } catch (error) {
      console.error('❌ Create share link error:', error);
      throw error;
    }
  },

  async getHabitMembers(habitId) {
    console.log('👥 Getting members for habit:', habitId);
    
    try {
      const response = await fetch(`${API_URL}/habits/${habitId}/members`, {
        headers: {
          'x-telegram-init-data': window.Telegram?.WebApp?.initData || '',
          'x-user-id': localStorage.getItem('user_id') || ''
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get members');
      }

      console.log('✅ Members loaded:', data.members?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Get members error:', error);
      throw error;
    }
  },

  // ... остальные методы ...
};


// App.jsx - Используем хук в главном компоненте

import React, { useEffect, useState } from 'react';
import { useDeepLink } from './hooks/useDeepLink';
import { useTelegram } from './hooks/useTelegram';
import Home from './pages/Home';
import Loader from './components/common/Loader';
import Toast from './components/common/Toast';
import './App.css';

function App() {
  const { tg, user } = useTelegram();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [joinedHabit, setJoinedHabit] = useState(null);

  // ✅ Обработка deep links
  const { processing: joiningHabit, error: joinError } = useDeepLink((habit) => {
    console.log('✅ Habit joined via deep link:', habit);
    setJoinedHabit(habit);
    
    setToast({
      message: `Successfully joined habit: "${habit.title}"! 🎉`,
      type: 'success',
      duration: 5000
    });

    // Перезагружаем список привычек через 1 секунду
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });

  useEffect(() => {
    if (joinError) {
      setToast({
        message: `Failed to join habit: ${joinError}`,
        type: 'error',
        duration: 5000
      });
    }
  }, [joinError]);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Устанавливаем цвета темы
      tg.setHeaderColor('#1a1a1a');
      tg.setBackgroundColor('#1a1a1a');
    }

    // Симулируем загрузку
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [tg]);

  if (loading || joiningHabit) {
    return (
      <div className="app-loading">
        <Loader size="large" />
        {joiningHabit && (
          <p style={{ marginTop: '20px', color: '#fff' }}>
            Joining habit...
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <Home />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 3000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;


// HabitDetail.jsx - Обновляем handleShare для правильного формата ссылки

const handleShare = async () => {
  try {
    const shareData = await habitService.createShareLink(habit.id);
    const shareCode = shareData.shareCode;
    
    console.log('📤 Creating share link:', { 
      habitId: habit.id, 
      shareCode,
      botUsername: 'CheckHabitlyBot' 
    });
    
    const shareText = `Join my "${habit.title}" habit!\n\n📝 Goal: ${habit.goal}\n\nLet's build better habits together! 💪`;
    
    // 🔥 ПРАВИЛЬНЫЙ ФОРМАТ для Telegram Mini App
    // Формат: https://t.me/BotUsername/AppName?startapp=PARAMETER
    const shareUrl = `https://t.me/CheckHabitlyBot/habittracker?startapp=join_${shareCode}`;
    
    console.log('🔗 Share URL:', shareUrl);
    console.log('📝 Share text:', shareText);
    
    const hasSeenFriendHint = localStorage.getItem('hasSeenFriendHint');
    if (!hasSeenFriendHint && members.length === 0) {
      setTimeout(() => {
        setShowFriendHint(true);
        localStorage.setItem('hasSeenFriendHint', 'true');
      }, 2000);
    }
    
    // Используем Telegram Share API
    if (tg?.openTelegramLink) {
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      console.log('📲 Opening Telegram share:', telegramShareUrl);
      tg.openTelegramLink(telegramShareUrl);
    } else {
      // Fallback для браузера
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      console.log('🌐 Opening in browser:', telegramShareUrl);
      window.open(telegramShareUrl, '_blank');
    }
    
    setToast({
      message: 'Share link created! Send it to your friends 🎉',
      type: 'success'
    });
  } catch (error) {
    console.error('❌ Failed to create share link:', error);
    setToast({
      message: 'Failed to create share link. Please try again.',
      type: 'error'
    });
  }
};