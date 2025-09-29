// src/services/auth.js
import api, { setAuthUser } from './api';

export const authenticateUser = async (initData, user) => {
  try {
    const isProduction = window.location.hostname !== 'localhost';
    
    console.log('🔍 DEBUG: Auth started');
    console.log('🔍 DEBUG: Telegram user data:', user);
    console.log('🔍 DEBUG: Language from Telegram:', user?.language_code);
    
    // В production проверяем наличие данных от Telegram
    if (isProduction) {
      if (!initData || !user || !user.id) {
        throw new Error('Отсутствуют данные авторизации Telegram');
      }
    } else {
      // Development mode - используем тестовые данные если нет реальных
      initData = initData || 'test_init_data';
      user = user || {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en' // В dev режиме по умолчанию английский
      };
      console.log('🔍 DEBUG: Dev mode, using test user with language:', user.language_code);
    }

    console.log('🔍 DEBUG: Sending auth request with user:', {
      id: user.id,
      language_code: user.language_code,
      first_name: user.first_name
    });

    const response = await api.post('/auth/telegram', {
      initData,
      user
    });

    console.log('🔍 DEBUG: Auth response received:', response.data);
    console.log('🔍 DEBUG: User language from server:', response.data.user?.language);

    if (response.data.success && response.data.user) {
      setAuthUser(response.data.user);
      
      // ВАЖНО: Сохраняем язык пользователя
      const userLanguage = response.data.user.language;
      console.log('🔍 DEBUG: User language to be used:', userLanguage);
      
      // НЕ сохраняем в localStorage - используем только из ответа сервера
      // localStorage удален намеренно
    }

    return response.data;
  } catch (error) {
    console.error('Auth error:', error);
    console.error('🔍 DEBUG: Auth error details:', error.response?.data);
    
    // Более понятные сообщения об ошибках
    if (error.response?.status === 403) {
      throw new Error('Ошибка проверки подписи Telegram');
    } else if (error.response?.status === 401) {
      throw new Error('Необходима авторизация через Telegram');
    }
    
    throw error;
  }
};