// frontend/src/services/packService.js - API сервис для работы с пакетами

import api from './api'; // Ваш настроенный axios instance

const packService = {
  /**
   * Получить список всех пакетов в магазине
   */
  async getStorePacks() {
    try {
      const response = await api.get('/packs/store');
      return response.data;
    } catch (error) {
      console.error('Get store packs error:', error);
      throw error;
    }
  },

  /**
   * Получить детальную информацию о пакете
   * @param {string} slug - URL-friendly идентификатор пакета
   */
  async getPackDetail(slug) {
    try {
      const response = await api.get(`/packs/store/${slug}`);
      return response.data;
    } catch (error) {
      console.error('Get pack detail error:', error);
      throw error;
    }
  },

  /**
   * Создать заказ на покупку пакета
   * @param {number} packId - ID пакета
   */
  async createOrder(packId) {
    try {
      const response = await api.post('/packs/orders/create', {
        pack_id: packId
      });
      return response.data;
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  },

  /**
   * Получить достижения по пакету
   * @param {number} packId - ID пакета
   */
  async getPackAchievements(packId) {
    try {
      const response = await api.get(`/achievements/pack/${packId}`);
      return response.data;
    } catch (error) {
      console.error('Get pack achievements error:', error);
      throw error;
    }
  },

  /**
   * Получить сводку по всем достижениям
   */
  async getAchievementsSummary() {
    try {
      const response = await api.get('/achievements/summary');
      return response.data;
    } catch (error) {
      console.error('Get achievements summary error:', error);
      throw error;
    }
  },

  /**
   * Получить последние разблокированные достижения
   * @param {number} limit - Количество достижений
   */
  async getRecentAchievements(limit = 10) {
    try {
      const response = await api.get('/achievements/recent', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get recent achievements error:', error);
      throw error;
    }
  }
};

export default packService;