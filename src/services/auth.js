import api, { setAuthUser } from './api';

export const authenticateUser = async (initData, user) => {
  try {
    console.log('🔐 Starting authentication...');
    console.log('📱 Telegram user data:', user);
    console.log('🌐 User language_code from Telegram:', user?.language_code);
    
    const isProduction = window.location.hostname !== 'localhost';
    
    // В production проверяем наличие данных от Telegram
    if (isProduction) {
      if (!initData || !user || !user.id) {
        throw new Error('Отсутствуют данные авторизации Telegram');
      }
      console.log('✅ Production mode - using real Telegram data');
    } else {
      // Development mode - используем тестовые данные если нет реальных
      if (!user || !user.id) {
        console.log('⚠️ Development mode - using mock data');
        user = {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'en' // По умолчанию английский для dev
        };
      }
      initData = initData || 'test_init_data';
    }

    // КРИТИЧНО: Убедимся, что language_code передается правильно
    const userDataToSend = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      language_code: user.language_code, // ВАЖНО: передаем язык
      is_premium: user.is_premium,
      photo_url: user.photo_url
    };

    console.log('📤 Sending to server:', {
      ...userDataToSend,
      language_code: userDataToSend.language_code || 'NOT SET!'
    });

    const response = await api.post('/auth/telegram', {
      initData,
      user: userDataToSend
    });

    console.log('📥 Server response:', {
      success: response.data.success,
      user_id: response.data.user?.id,
      user_language: response.data.user?.language,
      isNewUser: response.data.isNewUser
    });

    if (response.data.success && response.data.user) {
      setAuthUser(response.data.user);
      
      // Сохраняем язык пользователя в localStorage для быстрого доступа
      const userLanguage = response.data.user.language;
      if (userLanguage) {
        console.log(`💾 Saving user language to localStorage: ${userLanguage}`);
        localStorage.setItem('userLanguage', userLanguage);
      } else {
        console.error('⚠️ No language in server response!');
      }
      
      console.log(`✅ Authentication successful. User language: ${userLanguage}`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Auth error:', error);
    console.error('Error details:', error.response?.data);
    
    // Более понятные сообщения об ошибках
    if (error.response?.status === 403) {
      throw new Error('Ошибка проверки подписи Telegram');
    } else if (error.response?.status === 401) {
      throw new Error('Необходима авторизация через Telegram');
    }
    
    throw error;
  }
};