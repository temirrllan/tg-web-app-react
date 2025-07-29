import api from './api';

export const authenticateUser = async (initData, user) => {
  try {
    // Если нет данных от Telegram, используем тестовые
    if (!user) {
      console.warn('No Telegram user data, using test data');
      user = {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en'
      };
    }

    const response = await api.post('/auth/telegram', {
      initData: initData || 'test_init_data',
      user
    });

    return response.data;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};