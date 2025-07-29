import api, { setAuthUser } from './api';

export const authenticateUser = async (initData, user) => {
  try {
    const response = await api.post('/auth/telegram', {
      initData: initData || 'test_init_data',
      user: user || {
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en'
      }
    });

    // Сохраняем user_id для последующих запросов
    if (response.data.success && response.data.user) {
      setAuthUser(response.data.user);
    }

    return response.data;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};