import api, { setAuthUser } from './api';

// Нормализуем язык Telegram -> только 'en' | 'ru' | 'kk', иначе 'en'
const normalizeLanguage = (code) => {
  if (!code) return 'en';
  const lc = String(code).toLowerCase();

  // быстрые попадания
  if (lc === 'en' || lc === 'ru' || lc === 'kk') return lc;

  // варианты с региональными суффиксами
  if (lc.startsWith('en')) return 'en';
  if (lc.startsWith('ru')) return 'ru';
  if (lc.startsWith('kk')) return 'kk';

  // всё остальное — по умолчанию английский
  return 'en';
};

export const authenticateUser = async (initData, user) => {
  try {
    console.log('🔐 Starting authentication...');
    console.log('📱 Telegram user data:', user);
    console.log('🌐 language_code from Telegram:', user?.language_code);

    const isProduction = window.location.hostname !== 'localhost';

    // В production — обязательны реальные данные из Telegram
    if (isProduction) {
      if (!initData || !user || !user.id) {
        throw new Error('Отсутствуют данные авторизации Telegram');
      }
      console.log('✅ Production mode - using real Telegram data');
    } else {
      // В dev — подставим мок, если нет реальных
      if (!user || !user.id) {
        console.log('⚠️ Development mode - using mock data');
        user = {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
          language_code: 'en'
        };
      }
      initData = initData || 'test_init_data';
    }

    // КРИТИЧНО: нормализуем язык из Telegram в поддерживаемые ('en'|'ru'|'kk'), иначе 'en'
    const normalizedLang = normalizeLanguage(user?.language_code);

    // Готовим полезную нагрузку для бэка
    const userDataToSend = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      // важно: отправляем нормализованный язык
      language_code: normalizedLang,
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
      // На фронте храним только объект пользователя в состоянии api-клиента
      setAuthUser(response.data.user);

      // 🚫 НЕ сохраняем язык в localStorage
      // Требование: язык тянется из БД, а не из LS или Telegram после первого входа

      console.log(`✅ Authentication successful. User language (from DB): ${response.data.user.language}`);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Auth error:', error);
    console.error('Error details:', error.response?.data);

    if (error.response?.status === 403) {
      throw new Error('Ошибка проверки подписи Telegram');
    } else if (error.response?.status === 401) {
      throw new Error('Необходима авторизация через Telegram');
    }

    throw error;
  }
};
