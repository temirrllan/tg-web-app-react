import api from './api';

export const packService = {
  async getStorePacks() {
    const { data } = await api.get('/packs');
    return data;
  },

  async getPackBySlug(slug) {
    const { data } = await api.get(`/packs/${slug}`);
    return data;
  },

  async purchasePack(packId) {
    const { data } = await api.post(`/packs/${packId}/purchase`);
    return data;
  },

  async getMyPacks() {
    const { data } = await api.get('/my-packs');
    return data;
  },

  async getMyPackDetails(packId) {
    const { data } = await api.get(`/packs/${packId}/my-details`);
    return data;
  }
};