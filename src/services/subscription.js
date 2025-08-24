import api from './api';

export const subscriptionService = {
  async checkPromoCode(code) {
    try {
      const { data } = await api.post('/subscription/check-promo', { code });
      return data;
    } catch (error) {
      console.error('Check promo error:', error);
      return { valid: false };
    }
  },

  async createSubscription(subscriptionData) {
    const { data } = await api.post('/subscription/create', subscriptionData);
    return data;
  },

  async getSubscriptionStatus() {
    const { data } = await api.get('/subscription/status');
    return data;
  }
};