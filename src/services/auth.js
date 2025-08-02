import api, { setAuthUser } from './api';

export const authenticateUser = async (initData, user) => {
  try {
    const response = await api.post('/auth/telegram', {
      initData,
      user
    });

    if (response.data.success && response.data.user) {
      setAuthUser(response.data.user);
    }

    return response.data;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};
