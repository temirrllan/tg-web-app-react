// src/services/userService.js

import api from './api';

export const userService = {
  /**
   * Update user preferences in the DB.
   * @param {object} prefs - e.g. { show_swipe_hint: false }
   */
  async updatePreferences(prefs) {
    try {
      const response = await api.patch('/users/preferences', prefs);
      return response.data;
    } catch (error) {
      console.error('❌ updatePreferences error:', error);
      throw error;
    }
  }
};
