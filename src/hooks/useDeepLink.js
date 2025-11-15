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
        // 🔍 ПОЛНАЯ ОТЛАДКА
        console.log('🔍 DEEP LINK DEBUG:', {
          location_href: window.location.href,
          location_search: window.location.search,
          tg_initDataUnsafe: tg.initDataUnsafe,
          start_parameter: tg.initDataUnsafe?.start_parameter
        });

        // Получаем start параметр
        let startParam = tg.initDataUnsafe?.start_parameter;
        
        // Fallback через URL параметры
        if (!startParam) {
          const urlParams = new URLSearchParams(window.location.search);
          startParam = urlParams.get('startapp') || urlParams.get('tgWebAppStartParam');
          console.log('📍 Fallback startParam from URL:', startParam);
        }

        if (!startParam) {
          console.log('ℹ️ No start parameter found');
          return;
        }

        console.log('🎯 Start parameter found:', startParam);

        // Проверяем формат (должно начинаться с join_)
        if (!startParam.startsWith('join_')) {
          console.log('ℹ️ Start parameter is not a join request:', startParam);
          return;
        }

        // Проверяем, не обрабатывали ли мы уже эту ссылку
        const processedKey = `processed_${startParam}`;
        if (sessionStorage.getItem(processedKey)) {
          console.log('✅ This link was already processed in this session');
          return;
        }

        setProcessing(true);
        setError(null);

        try {
          console.log('📤 Calling API: /habits/join with code:', startParam);
          const result = await habitService.joinHabit(startParam);

          console.log('📥 API response:', result);

          if (result.success) {
            console.log('✅ Successfully joined habit:', result.habit);

            // Сохраняем в session storage
            sessionStorage.setItem(processedKey, Date.now().toString());

            // Показываем уведомление
            if (tg.showAlert) {
              const message = result.alreadyMember 
                ? `You are already a member of "${result.habit.title}"! ✅`
                : `Successfully joined "${result.habit.title}"! 🎉`;
              
              tg.showAlert(message);
            }

            // Callback
            if (onHabitJoined && !result.alreadyMember) {
              onHabitJoined(result.habit);
            }
          } else {
            throw new Error(result.error || 'Failed to join habit');
          }
        } catch (err) {
          console.error('❌ Failed to join habit:', err);
          setError(err.message);

          if (tg.showAlert) {
            let errorMessage = 'Failed to join habit. ';
            
            if (err.message.includes('already')) {
              errorMessage = 'You are already a member! ✅';
            } else if (err.message.includes('Invalid') || err.message.includes('not found')) {
              errorMessage = 'This invitation link is invalid or expired. 🔗';
            } else {
              errorMessage += err.message;
            }
            
            tg.showAlert(errorMessage);
          }
        } finally {
          setProcessing(false);
        }
      } catch (err) {
        console.error('❌ Deep link handler error:', err);
        setError(err.message);
        setProcessing(false);
      }
    };

    // Задержка для инициализации Telegram
    const timer = setTimeout(() => {
      handleDeepLink();
    }, 1000);

    return () => clearTimeout(timer);
  }, [tg, onHabitJoined]);

  return { processing, error };
};