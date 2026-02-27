// src/services/specialHabits.js
import api from './api';

export const specialHabitsService = {

  // ─── Packs ──────────────────────────────────────────────────────────────────

  async getPacks({ filter = 'all', search = '' } = {}) {
    const { data } = await api.get('/special-habits/packs', {
      params: { filter, search }
    });
    return data;
  },

  async getPackDetails(packId) {
    const { data } = await api.get(`/special-habits/packs/${packId}`);
    return data;
  },

  async purchasePack(packId) {
    const { data } = await api.post(`/special-habits/packs/${packId}/purchase`);
    return data;
  },

  async getMyPacks() {
    const { data } = await api.get('/special-habits/my-packs');
    return data;
  },

  // ─── Achievements ────────────────────────────────────────────────────────────

  async getPackProgress(packId) {
    const { data } = await api.get(`/special-habits/packs/${packId}/progress`);
    return data;
  },

  // ─── Habits for date (Special tab) ──────────────────────────────────────────

  async getSpecialHabitsForDate(date) {
    const { data } = await api.get('/special-habits/habits', { params: { date } });
    return data;
  },

  // ─── Mark / Unmark special habit ────────────────────────────────────────────

  async markSpecialHabit(habitId, status, date) {
    const { data } = await api.post(`/special-habits/habit/${habitId}/mark`, {
      status,
      date
    });
    return data; // { success, mark, newly_unlocked }
  },

  async unmarkSpecialHabit(habitId, date) {
    // "Unmark" = set to pending via the special mark endpoint
    return this.markSpecialHabit(habitId, 'pending', date);
  },
};
