import api, { setAuthUser } from './api';

export const authenticateUser = async (initData, user) => {
  try {
    console.log('🔐 Authenticating user...');
    const isProduction = window.location.hostname !== 'localhost';
    
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
        language_code: 'en' // По умолчанию английский для dev
      };
    }

    // ВАЖНО: Передаем language_code на сервер
    console.log('📤 Sending user data with language_code:', user.language_code);

    const response = await api.post('/auth/telegram', {
      initData,
      user: {
        ...user,
        language_code: user.language_code || 'en' // Гарантируем наличие language_code
      }
    });

    if (response.data.success && response.data.user) {
      setAuthUser(response.data.user);
      
      // Сохраняем язык пользователя в localStorage для быстрого доступа
      const userLanguage = response.data.user.language;
      if (userLanguage) {
        console.log('💾 Saving user language to localStorage:', userLanguage);
        localStorage.setItem('userLanguage', userLanguage);
      }
      
      console.log('✅ Authentication successful. User language:', userLanguage);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Auth error:', error);
    
    // Более понятные сообщения об ошибках
    if (error.response?.status === 403) {
      throw new Error('Ошибка проверки подписи Telegram');
    } else if (error.response?.status === 401) {
      throw new Error('Необходима авторизация через Telegram');
    }
    
    throw error;
  }
};