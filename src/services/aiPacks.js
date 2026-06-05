// src/services/aiPacks.js
import api from './api';

export const aiPacksService = {
  async getOptions() {
    const { data } = await api.get('/ai-packs/options');
    return data;
  },

  // payload: { prompt, survey, lang }
  async createRequest(payload) {
    const { data } = await api.post('/ai-packs/requests', payload);
    return data;
  },

  async getStatus(requestId) {
    const { data } = await api.get(`/ai-packs/requests/${requestId}`);
    return data;
  },

  async generate(requestId) {
    const { data } = await api.post(`/ai-packs/requests/${requestId}/generate`);
    return data;
  },

  async redo(requestId) {
    const { data } = await api.post(`/ai-packs/requests/${requestId}/redo`);
    return data;
  },

  async activate(requestId) {
    const { data } = await api.post(`/ai-packs/requests/${requestId}/activate`);
    return data;
  },

  async getMy() {
    const { data } = await api.get('/ai-packs/my');
    return data;
  },
};

export default aiPacksService;
