import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor для добавления данных пользователя
api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    // В продакшене будем отправлять initData для валидации
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  }
  return config;
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.showPremium) {
      // Можно показать модалку с предложением купить Premium
      console.log('Premium required');
    }
    return Promise.reject(error);
  }
);

export default api;