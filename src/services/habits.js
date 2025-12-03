import api from './api';
import habitServiceOptimized from './habitsOptimized';

export const habitService = {
  // ============ МЕТОДЫ С КЭШИРОВАНИЕМ ============
  
  /**
   * Получить категории (кэшируется на 30 минут)
   */
  async getCategories() {
    return await habitServiceOptimized.getCategories();
  },

  /**
   * Получить все привычки (кэшируется на 2 минуты)
   */
  async getAllHabits() {
    return await habitServiceOptimized.getAllHabits();
  },

  /**
   * Получить привычки на сегодня (кэшируется на 1 минуту)
   */
   async getTodayHabits() {
    return await habitServiceOptimized.getTodayHabits();
  },
  /**
   * Получить привычки для конкретной даты (кэшируется на 2 минуты)
   */
  async getHabitsForDate(date) {
    return await habitServiceOptimized.getHabitsForDate(date);
  },

  /**
   * Получить статистику привычки (кэшируется на 5 минут)
   */
  async getHabitStatistics(habitId) {
    return await habitServiceOptimized.getHabitStatistics(habitId);
  },

  /**
   * Получить участников привычки (кэшируется на 2 минуты)
   */
   async getHabitMembers(habitId) {
    return await habitServiceOptimized.getHabitMembers(habitId);
  },

  /**
   * Получить профиль пользователя (кэшируется на 10 минут)
   */
   async getUserProfile() {
    return await habitServiceOptimized.getUserProfile();
  },

  /**
   * Проверить лимиты подписки (кэшируется на 5 минут)
   */
  async checkSubscriptionLimits() {
    return await habitServiceOptimized.checkSubscriptionLimits();
  },

  // ============ МЕТОДЫ БЕЗ КЭШИРОВАНИЯ (изменяют данные) ============

  /**
   * Создать привычку (инвалидирует кэш)
   */
  async createHabit(habitData) {
    return await habitServiceOptimized.createHabit(habitData);
  },

  /**
   * Обновить привычку (инвалидирует кэш)
   */
  async updateHabit(habitId, updates) {
    return await habitServiceOptimized.updateHabit(habitId, updates);
  },

  /**
   * Удалить привычку (инвалидирует кэш)
   */
   async deleteHabit(habitId) {
    return await habitServiceOptimized.deleteHabit(habitId);
  },

  /**
   * Отметить привычку (инвалидирует кэш)
   */
  async markHabit(habitId, status = 'completed', date) {
    return await habitServiceOptimized.markHabit(habitId, status, date);
  },

  /**
   * Снять отметку (инвалидирует кэш)
   */
  async unmarkHabit(habitId, date) {
    return await habitServiceOptimized.unmarkHabit(habitId, date);
  },

  /**
   * Обновить язык пользователя (инвалидирует кэш)
   */
  async updateUserLanguage(language) {
    return await habitServiceOptimized.updateUserLanguage(language);
  },

   async joinHabit(shareCode) {
    return await habitServiceOptimized.joinHabit(shareCode);
  },

 async removeMember(habitId, userId) {
    const { data } = await api.delete(`/habits/${habitId}/members/${userId}`);
    
    // Инвалидируем кэш участников
    habitServiceOptimized.invalidateHabitsCache();
    
    return data;
  },

   async punchFriend(habitId, userId) {
    const { data } = await api.post(`/habits/${habitId}/punch/${userId}`);
    return data;
  },

  async createShareLink(habitId) {
    const { data } = await api.post(`/habits/${habitId}/share`);
    return data;
  },
async checkFriendLimit(habitId) {
    const { data } = await api.get(`/habits/${habitId}/check-friend-limit`);
    return data;
  },
  async getHabitOwner(habitId) {
    const { data } = await api.get(`/habits/${habitId}/owner`);
    return data;
  },
async activatePremium(plan) {
    const { data } = await api.post('/subscription/activate', { plan });
    
    // Инвалидируем кэш подписки
    habitServiceOptimized.invalidateSubscriptionCache();
    
    return data;
  },
  async cancelSubscription() {
    try {
      const { data } = await api.post('/subscription/cancel');
      
      // Инвалидируем кэш подписки
      habitServiceOptimized.invalidateSubscriptionCache();
      
      return data;
    } catch (error) {
      console.error('cancelSubscription API error:', error);
      
      if (error.response) {
        return {
          success: false,
          error: error.response.data?.error || error.response.data?.message || 'Server error'
        };
      } else if (error.request) {
        return {
          success: false,
          error: 'No response from server. Please check your connection.'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Failed to cancel subscription'
        };
      }
    }
    },

    async getSubscriptionHistory() {
    try {
      const { data } = await api.get('/subscription/history');
      return data;
    } catch (error) {
      console.error('getSubscriptionHistory error:', error);
      return { success: false, history: [] };
    }
  },

  async getSubscriptionPlans() {
    try {
      const { data } = await api.get('/subscription/plans');
      return data;
    } catch (error) {
      console.error('getSubscriptionPlans error:', error);
      return { success: false, plans: [] };
    }
  },
  
  // ============ УТИЛИТЫ ============

  /**
   * Очистить весь кэш
   */
   clearCache() {
    habitServiceOptimized.clearCache();
  },

  /**
   * Инвалидировать кэш привычек
   */
  invalidateHabitsCache() {
    habitServiceOptimized.invalidateHabitsCache();
  },

  /**
   * Инвалидировать кэш подписки
   */
   invalidateSubscriptionCache() {
    habitServiceOptimized.invalidateSubscriptionCache();
  }
};