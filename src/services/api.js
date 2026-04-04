// src/services/api.js

import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 секунд
});

// Сохраняем user_id после авторизации
export const setAuthUser = (user) => {
  if (user && user.id) {
    localStorage.setItem('user_id', user.id);
    console.log('✅ Saved user_id to localStorage:', user.id);
  }
};

// Request interceptor
api.interceptors.request.use((config) => {
  const isProduction = window.location.hostname !== 'localhost';
  const tg = window.Telegram?.WebApp;
  
  console.log('📤 API Request:', {
    url: config.url,
    method: config.method,
    hasInitData: !!tg?.initData,
    initDataLength: tg?.initData?.length || 0
  });
  
  // Добавляем initData
  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
    console.log('✅ Added initData to request');
  } else if (!isProduction) {
    config.headers['X-Telegram-Init-Data'] = 'development';
    console.log('⚠️ Development mode: using mock initData');
  } else {
    console.warn('⚠️ No initData available in production!');
  }
  
  // Добавляем user_id если есть
  const userId = localStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }
  
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      url: response.config.url,
      status: response.status,
      success: response.data?.success
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    const isProduction = window.location.hostname !== 'localhost';
    
    if (error.response?.status === 403) {
      if (error.response?.data?.showPremium) {
        console.log('💎 Premium required');
      } else if (isProduction) {
        console.error('🔒 Authorization failed');
      }
    }
    
    if (error.response?.status === 401 && isProduction) {
      console.error('🚫 Authentication failed - redirect to bot');
      
      // Показываем понятное сообщение
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
          'Please open the app through @CheckHabitlyBot',
          () => {
            window.Telegram.WebApp.close();
          }
        );
      }
    }
    
    // Maintenance mode
    if (error.response?.status === 503 && error.response?.data?.maintenance) {
      window.dispatchEvent(new CustomEvent('maintenance-mode'));
      return Promise.reject(error);
    }

    // Network error
    if (!error.response) {
      console.error('🌐 Network error - no response from server');
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
          'Network error. Please check your connection and try again.'
        );
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;