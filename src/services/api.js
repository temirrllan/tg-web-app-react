import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setAuthUser = (user) => {
  if (user && user.id) {
    localStorage.setItem('user_id', user.id);
  }
};

api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp;

  if (tg?.initData) {
    config.headers['X-Telegram-Init-Data'] = tg.initData;
  } else {
    config.headers['X-Telegram-Init-Data'] = 'development';
  }

  const userId = localStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-Id'] = userId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (data?.error) {
        alert(`Error: ${data.error}`);
      } else if (status === 401) {
        alert('Unauthorized. Please log in again.');
        // TODO: добавить логаут / редирект
      } else if (status === 403) {
        alert('Access denied. Upgrade your subscription.');
      } else {
        alert('Unexpected error occurred. Please try again.');
      }
    } else {
      alert('Network error. Check your connection.');
    }
    return Promise.reject(error);
  }
);

export default api;
