// src/services/habitsOptimized.js - ИСПРАВЛЕНО: Убрано автоматическое обновление кэша

import api from './api';
import cacheService from './cacheService';

const CACHE_KEYS = {
  todayHabits: () => 'habits_today',
  habitsForDate: (date) => `habits_date_${date}`,
  allHabits: () => 'habits_all',
  habitStats: (id) => `habit_stats_${id}`,
  habitMembers: (id) => `habit_members_${id}`,
  userProfile: () => 'user_profile',
  subscriptionLimits: () => 'subscription_limits',
  categories: () => 'categories'
};

const CACHE_TTL = {
  FAST: 1 * 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  SLOW: 30 * 60 * 1000,
  STATIC: 60 * 60 * 1000
};

export const habitService = {
  async getTodayHabits(forceRefresh = false) {
    const key = CACHE_KEYS.todayHabits();
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get('/habits/today');
        return data;
      },
      { ttl: CACHE_TTL.FAST, forceRefresh }
    );
  },

  async getHabitsForDate(date, forceRefresh = false) {
    const key = CACHE_KEYS.habitsForDate(date);
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get(`/habits/date/${date}`);
        return data;
      },
      { ttl: CACHE_TTL.MEDIUM, forceRefresh }
    );
  },

  async getAllHabits(forceRefresh = false) {
    const key = CACHE_KEYS.allHabits();
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get('/habits');
        return data;
      },
      { ttl: CACHE_TTL.MEDIUM, forceRefresh }
    );
  },

  async getHabitStatistics(habitId, forceRefresh = false) {
    const key = CACHE_KEYS.habitStats(habitId);
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get(`/habits/${habitId}/statistics`);
        return data;
      },
      { ttl: CACHE_TTL.MEDIUM, forceRefresh }
    );
  },

  async getHabitMembers(habitId, forceRefresh = false) {
    const key = CACHE_KEYS.habitMembers(habitId);
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get(`/habits/${habitId}/members`);
        return data;
      },
      { ttl: CACHE_TTL.FAST, forceRefresh }
    );
  },

  async getCategories(forceRefresh = false) {
    const key = CACHE_KEYS.categories();
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get('/categories');
        return data;
      },
      { ttl: CACHE_TTL.STATIC, forceRefresh }
    );
  },

  async getUserProfile(forceRefresh = false) {
    const key = CACHE_KEYS.userProfile();
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get('/user/profile');
        return data.user;
      },
      { ttl: CACHE_TTL.SLOW, forceRefresh }
    );
  },

  async checkSubscriptionLimits(forceRefresh = false) {
    const key = CACHE_KEYS.subscriptionLimits();
    
    return cacheService.fetch(
      key,
      async () => {
        const { data } = await api.get('/subscription/check');
        return data;
      },
      { ttl: CACHE_TTL.MEDIUM, forceRefresh }
    );
  },

  async createHabit(habitData) {
    const { data } = await api.post('/habits', habitData);
    
    cacheService.invalidate('habits_');
    cacheService.invalidate('subscription_');
    
    return data;
  },

  async updateHabit(habitId, updates) {
    const { data } = await api.patch(`/habits/${habitId}`, updates);
    
    cacheService.invalidate('habits_');
    cacheService.invalidate(`habit_stats_${habitId}`);
    cacheService.invalidate(`habit_members_${habitId}`);
    
    return data;
  },

  async deleteHabit(habitId) {
    const { data } = await api.delete(`/habits/${habitId}`);
    
    cacheService.invalidate('habits_');
    cacheService.invalidate(`habit_`);
    cacheService.invalidate('subscription_');
    
    return data;
  },

  /**
   * 🔥 ИСПРАВЛЕНО: Отметить привычку БЕЗ автоматического обновления кэша
   */
  async markHabit(habitId, status = 'completed', date) {
    const markDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isToday = markDate === today;
    
    console.log('🟢 ========== markHabit SERVICE ==========');
    console.log('Parameters:', { habitId, status, markDate, today, isToday });
    
    const todayKey = CACHE_KEYS.todayHabits();
    const dateKey = CACHE_KEYS.habitsForDate(markDate);
    
    console.log('Cache keys:', { todayKey, dateKey });
    
    // КРИТИЧНО: Обновляем ТОЛЬКО нужный кэш оптимистично
    if (isToday) {
      console.log('📝 Updating TODAY cache optimistically');
      this.updateHabitStatusInCache(todayKey, habitId, status);
    } else {
      console.log('📝 NOT updating TODAY cache (marking for different date)');
    }
    
    console.log('📝 Updating DATE cache optimistically for', markDate);
    this.updateHabitStatusInCache(dateKey, habitId, status);
    
    try {
      console.log('📤 Sending mark request to API...');
      
      const { data } = await api.post(`/habits/${habitId}/mark`, {
        status,
        date: markDate
      });
      
      console.log('✅ API response received:', data);
      
      // 🔥 НОВАЯ ЛОГИКА: НЕ обновляем автоматически с сервера
      // Полагаемся на оптимистичное обновление
      // Обновление произойдёт только при явном refresh, visibilitychange или ошибке
      
      console.log('✅ Using optimistic update, skipping automatic server refresh');
      
      // Инвалидируем только статистику (это безопасно)
      console.log('🗑️ Invalidating stats cache');
      cacheService.invalidate(`habit_stats_${habitId}`);
      cacheService.invalidate(`habit_members_${habitId}`);
      
      return data;
    } catch (error) {
      console.error('❌ markHabit API error:', error);
      
      // При ошибке откатываем оптимистичное обновление
      console.log('⏮️ Rolling back optimistic updates');
      if (isToday) {
        cacheService.invalidate(todayKey);
      }
      cacheService.invalidate(dateKey);
      throw error;
    }
  },

  /**
   * 🔥 ИСПРАВЛЕНО: Снять отметку БЕЗ автоматического обновления кэша
   */
  async unmarkHabit(habitId, date) {
    const unmarkDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isToday = unmarkDate === today;
    
    console.log('🟡 ========== unmarkHabit SERVICE ==========');
    console.log('Parameters:', { habitId, unmarkDate, today, isToday });
    
    const todayKey = CACHE_KEYS.todayHabits();
    const dateKey = CACHE_KEYS.habitsForDate(unmarkDate);
    
    // КРИТИЧНО: Обновляем ТОЛЬКО нужный кэш оптимистично
    if (isToday) {
      console.log('📝 Updating TODAY cache optimistically');
      this.updateHabitStatusInCache(todayKey, habitId, 'pending');
    } else {
      console.log('📝 NOT updating TODAY cache (unmarking for different date)');
    }
    
    console.log('📝 Updating DATE cache optimistically for', unmarkDate);
    this.updateHabitStatusInCache(dateKey, habitId, 'pending');
    
    try {
      console.log('📤 Sending unmark request to API...');
      
      const { data } = await api.delete(`/habits/${habitId}/mark?date=${unmarkDate}`);
      
      console.log('✅ API response received:', data);
      
      // 🔥 НОВАЯ ЛОГИКА: НЕ обновляем автоматически с сервера
      console.log('✅ Using optimistic update, skipping automatic server refresh');
      
      // Инвалидируем только статистику
      console.log('🗑️ Invalidating stats cache');
      cacheService.invalidate(`habit_stats_${habitId}`);
      cacheService.invalidate(`habit_members_${habitId}`);
      
      return data;
    } catch (error) {
      console.error('❌ unmarkHabit error, rolling back cache');
      
      if (isToday) {
        console.log('⏮️ Rolling back TODAY cache');
        cacheService.invalidate(todayKey);
      }
      console.log('⏮️ Rolling back DATE cache for', unmarkDate);
      cacheService.invalidate(dateKey);
      cacheService.invalidate(`habit_stats_${habitId}`);
      
      throw error;
    }
  },

  updateHabitStatusInCache(cacheKey, habitId, newStatus) {
    console.log('🔧 updateHabitStatusInCache:', { cacheKey, habitId, newStatus });
    const cached = cacheService.get(cacheKey);
    
    if (!cached || !cached.habits) {
      console.log('⚠️ No cached data found for key:', cacheKey);
      return;
    }

    console.log('Current cached habits:', cached.habits.map(h => ({
      id: h.id,
      status: h.today_status
    })));

    const updatedHabits = cached.habits.map(habit => {
      if (habit.id === habitId) {
        console.log(`✏️ Updating habit ${habitId}: ${habit.today_status} -> ${newStatus}`);
        return { ...habit, today_status: newStatus };
      }
      return habit;
    });

    const updatedData = {
      ...cached,
      habits: updatedHabits,
      stats: this.recalculateStats(updatedHabits)
    };

    cacheService.set(cacheKey, updatedData, CACHE_TTL.FAST);
    console.log('✅ Cache updated');
  },

  recalculateStats(habits) {
    const completed = habits.filter(h => h.today_status === 'completed').length;
    const total = habits.length;
    const failed = habits.filter(h => h.today_status === 'failed').length;
    const skipped = habits.filter(h => h.today_status === 'skipped').length;
    const pending = habits.filter(h => h.today_status === 'pending').length;

    return { completed, total, failed, skipped, pending };
  },

  async updateUserLanguage(language) {
    const { data } = await api.patch('/user/language', { language });
    
    cacheService.invalidate('user_profile');
    
    return data;
  },

  async joinHabit(shareCode) {
    const { data } = await api.post('/habits/join', { shareCode });
    
    cacheService.invalidate('habits_');
    
    return data;
  },

  async createShareLink(habitId) {
    const { data } = await api.post(`/habits/${habitId}/share`);
    return data;
  },

  async punchFriend(habitId, userId) {
    const { data } = await api.post(`/habits/${habitId}/punch/${userId}`);
    return data;
  },

  async removeMember(habitId, userId) {
    const { data } = await api.delete(`/habits/${habitId}/members/${userId}`);
    
    cacheService.invalidate(`habit_members_${habitId}`);
    
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

  clearCache() {
    cacheService.clear();
  },

  invalidateHabitsCache() {
    cacheService.invalidate('habits_');
  },

  invalidateSubscriptionCache() {
    cacheService.invalidate('subscription_');
  }
};

export default habitService;