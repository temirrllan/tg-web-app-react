// src/services/api.js
import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Сохраняем user_id после успешной авторизации
export const setAuthUser = (user) => {
  if (user && user.id) {  
    localStorage.setItem('user_id', user.id);
  }
};

// Interceptor для добавления данных пользователя
api.interceptors.request.use((config) => {
  const isProduction = window.location.hostname !== 'localhost';
  const tg = window.Telegram?.WebApp;
  
  // В production всегда отправляем initData
  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  } else if (!isProduction) {
    // Только для development
    config.headers['X-Telegram-Init-Data'] = 'development';
  }
  
  // Добавляем user_id если есть
  const userId = localStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  
  return config;
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isProduction = window.location.hostname !== 'localhost';
    
    if (error.response?.status === 403) {
      if (error.response?.data?.showPremium) {
        console.log('Premium required');
        // TODO: Показать модалку Premium
      } else if (isProduction) {
        // В production при ошибке авторизации показываем сообщение
        console.error('Authorization failed');
      }
    }
    
    if (error.response?.status === 401 && isProduction) {
      console.error('Authentication failed - redirect to bot');
      // Можно показать сообщение пользователю
    }
    
    return Promise.reject(error);
  }
);

export default api;