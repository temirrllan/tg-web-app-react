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
    sessionStorage.setItem('user_id', user.id);
    sessionStorage.setItem('user_data', JSON.stringify(user));
    console.log('User data saved:', user.id);
  }
};

// Получаем сохраненного пользователя
export const getAuthUser = () => {
  const userData = sessionStorage.getItem('user_data');
  return userData ? JSON.parse(userData) : null;
};

// Очищаем данные пользователя
export const clearAuthUser = () => {
  sessionStorage.removeItem('user_id');
  sessionStorage.removeItem('user_data');
};

// Interceptor для добавления данных пользователя
api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;
  
  // Всегда отправляем initData если есть
  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  } else {
    config.headers['X-Telegram-Init-Data'] = 'development';
  }
  
  // Добавляем user_id если есть
  const userId = sessionStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  
  return config;
});

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.showPremium) {
      console.log('Premium required');
    }
    
    if (error.response?.status === 401) {
      console.error('Authentication failed');
      // Очищаем данные и перезагружаем
      clearAuthUser();
      // Можно добавить редирект на страницу авторизации
    }
    
    return Promise.reject(error);
  }
);

export default api;