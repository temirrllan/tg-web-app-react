const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const authenticateUser = async (initData, user) => {
  try {
    const response = await fetch(`${API_URL}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData,
        user
      }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};