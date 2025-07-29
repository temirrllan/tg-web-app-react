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
  
  if (tg?.initData) {
    // Отправляем initData для валидации на сервере
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  } else {
    // Для разработки используем тестовые данные
    config.headers['X-Telegram-Init-Data'] = 'test_init_data';
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
    
    if (error.response?.status === 401) {
      console.error('Authentication failed');
      // Можно перезагрузить страницу или показать ошибку
    }
    
    return Promise.reject(error);
  }
);

export default api;