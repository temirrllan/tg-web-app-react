// src/services/habitsOptimized.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
// Проблема: При отметке за вчерашний день обновлялись данные для сегодня
// Решение: Обновляем ТОЛЬКО соответствующую дату

import api from './api';
import cacheService from './cacheService';

/**
 * Генерация ключей кэша
 */
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

/**
 * TTL для разных типов данных
 */
const CACHE_TTL = {
  FAST: 1 * 60 * 1000,      // 1 минута
  MEDIUM: 5 * 60 * 1000,    // 5 минут
  SLOW: 30 * 60 * 1000,     // 30 минут
  STATIC: 60 * 60 * 1000    // 1 час
};

export const habitService = {
  /**
   * Получить привычки на сегодня (с кэшированием)
   */
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

  /**
   * Получить привычки для конкретной даты
   */
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

  /**
   * Получить все привычки
   */
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

  /**
   * Получить статистику привычки
   */
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

  /**
   * Получить участников привычки
   */
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

  /**
   * Получить категории
   */
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

  /**
   * Получить профиль пользователя
   */
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

  /**
   * Проверить лимиты подписки
   */
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

  // ============ МЕТОДЫ БЕЗ КЭША (изменяют данные) ============

  /**
   * Создать привычку (с инвалидацией кэша)
   */
  async createHabit(habitData) {
    const { data } = await api.post('/habits', habitData);
    
    // Инвалидируем связанные кэши
    cacheService.invalidate('habits_');
    cacheService.invalidate('subscription_');
    
    return data;
  },

  /**
   * Обновить привычку
   */
  async updateHabit(habitId, updates) {
    const { data } = await api.patch(`/habits/${habitId}`, updates);
    
    // Инвалидируем связанные кэши
    cacheService.invalidate('habits_');
    cacheService.invalidate(`habit_stats_${habitId}`);
    cacheService.invalidate(`habit_members_${habitId}`);
    
    return data;
  },

  /**
   * Удалить привычку
   */
  async deleteHabit(habitId) {
    const { data } = await api.delete(`/habits/${habitId}`);
    
    // Инвалидируем все кэши привычек
    cacheService.invalidate('habits_');
    cacheService.invalidate(`habit_`);
    cacheService.invalidate('subscription_');
    
    return data;
  },

  /**
   * 🔥 ИСПРАВЛЕНО: Отметить привычку (с оптимистичным обновлением)
   * Теперь обновляет ТОЛЬКО соответствующую дату
   */
  async markHabit(habitId, status = 'completed', date) {
    const markDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isToday = markDate === today;
    console.log('🟢 ========== markHabit SERVICE ==========');
    console.log('Parameters:', { habitId, status, markDate });
    console.log('Today:', today);
    console.log('Is marking for today?', isToday);
    console.log('🎯 markHabit:', { habitId, status, markDate, today, isToday });
    
    // Оптимистичное обновление кэша
    const todayKey = CACHE_KEYS.todayHabits();
    const dateKey = CACHE_KEYS.habitsForDate(markDate);
        console.log('Cache keys:', { todayKey, dateKey });

    // ВАЖНО: Обновляем ТОЛЬКО нужный кэш
    if (isToday) {
            console.log('📝 Updating TODAY cache optimistically');

      this.updateHabitStatusInCache(todayKey, habitId, status);
    }else {
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

      // 🔥 КРИТИЧНО: Обновляем с сервера ТОЛЬКО соответствующую дату
      if (isToday) {
        console.log('🔄 Refreshing TODAY habits from server (because isToday=true)');
        await this.getTodayHabits(true);
      } else {
        console.log('✅ Updating habits for date', markDate, 'from server');
        // Для других дат обновляем только их кэш
         console.log('🔄 Refreshing habits for', markDate, 'from server (because isToday=false)');
        console.log('⚠️ NOT refreshing TODAY habits - they should remain unchanged!');
        await this.getHabitsForDate(markDate, true);
      }
      
      return data;
    } catch (error) {
      // Откатываем оптимистичное обновление
      console.error('❌ markHabit API error:', error);
      if (isToday) {
        cacheService.invalidate('habits_today');
      }
      cacheService.invalidate(`habits_date_${markDate}`);
      throw error;
    }
  },

  /**
   * 🔥 ИСПРАВЛЕНО: Снять отметку
   * Теперь обновляет ТОЛЬКО соответствующую дату
   */
  async unmarkHabit(habitId, date) {
    const unmarkDate = date || new Date().toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const isToday = unmarkDate === today;
     console.log('🟡 ========== unmarkHabit SERVICE ==========');
    console.log('Parameters:', { habitId, unmarkDate });
    console.log('Today:', today);
    console.log('Is unmarking for today?', isToday);
    console.log('↩️ unmarkHabit:', { habitId, unmarkDate, today, isToday });
    
    // Оптимистичное обновление
    const todayKey = CACHE_KEYS.todayHabits();
    const dateKey = CACHE_KEYS.habitsForDate(unmarkDate);
    
    // ВАЖНО: Обновляем ТОЛЬКО нужный кэш
    if (isToday) {      console.log('📝 Updating TODAY cache optimistically');

      this.updateHabitStatusInCache(todayKey, habitId, 'pending');
    }else {
      console.log('📝 NOT updating TODAY cache (unmarking for different date)');
    }    console.log('📝 Updating DATE cache optimistically for', unmarkDate);

    this.updateHabitStatusInCache(dateKey, habitId, 'pending');
    
    try {
            console.log('📤 Sending unmark request to API...');

      const { data } = await api.delete(`/habits/${habitId}/mark?date=${unmarkDate}`);
      console.log('✅ API response received:', data);

      console.log('🗑️ Invalidating stats cache');
      cacheService.invalidate(`habit_stats_${habitId}`);
      cacheService.invalidate(`habit_members_${habitId}`);


      // 🔥 КРИТИЧНО: Обновляем с сервера ТОЛЬКО соответствующую дату
      if (isToday) {
        console.log('🔄 Refreshing TODAY habits from server (because isToday=true)');

        console.log('✅ Updating today habits from server');
        await this.getTodayHabits(true);
      } else {
       console.log('🔄 Refreshing habits for', unmarkDate, 'from server (because isToday=false)');
        console.log('⚠️ NOT refreshing TODAY habits - they should remain unchanged!');
        // Для других дат обновляем только их кэш
        await this.getHabitsForDate(unmarkDate, true);
      }
      
      return data;
    } catch (error) {
      console.error('❌ unmarkHabit error, rolling back cache');
      if (isToday) {
        console.log('⏮️ Rolling back TODAY cache');
        cacheService.invalidate('habits_today');
      }
      console.log('⏮️ Rolling back DATE cache for', unmarkDate);
      cacheService.invalidate(`habits_date_${unmarkDate}`);
      cacheService.invalidate(`habit_stats_${habitId}`);

      throw error;
    }
  },

  /**
   * Обновление статуса в кэше (для оптимистичных обновлений)
   */
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

    cacheService.set(cacheKey, updatedData, CACHE_TTL.FAST)
    console.log('✅ Cache updated');;
  },

  /**
   * Пересчёт статистики для оптимистичного обновления
   */
  recalculateStats(habits) {
    const completed = habits.filter(h => h.today_status === 'completed').length;
    const total = habits.length;
    const failed = habits.filter(h => h.today_status === 'failed').length;
    const skipped = habits.filter(h => h.today_status === 'skipped').length;
    const pending = habits.filter(h => h.today_status === 'pending').length;

    return { completed, total, failed, skipped, pending };
  },

  /**
   * Обновить язык пользователя
   */
  async updateUserLanguage(language) {
    const { data } = await api.patch('/user/language', { language });
    
    // Инвалидируем кэш профиля
    cacheService.invalidate('user_profile');
    
    return data;
  },

  /**
   * Присоединиться к привычке
   */
  async joinHabit(shareCode) {
    const { data } = await api.post('/habits/join', { shareCode });
    
    // Инвалидируем все кэши привычек
    cacheService.invalidate('habits_');
    
    return data;
  },

  /**
   * Создать ссылку для шаринга
   */
  async createShareLink(habitId) {
    const { data } = await api.post(`/habits/${habitId}/share`);
    return data;
  },

  /**
   * Punch друга
   */
  async punchFriend(habitId, userId) {
    const { data } = await api.post(`/habits/${habitId}/punch/${userId}`);
    return data;
  },

  /**
   * Удалить участника
   */
  async removeMember(habitId, userId) {
    const { data } = await api.delete(`/habits/${habitId}/members/${userId}`);
    
    // Инвалидируем кэш участников
    cacheService.invalidate(`habit_members_${habitId}`);
    
    return data;
  },

  /**
   * Проверить лимит друзей
   */
  async checkFriendLimit(habitId) {
    const { data } = await api.get(`/habits/${habitId}/check-friend-limit`);
    return data;
  },

  /**
   * Получить информацию о владельце
   */
  async getHabitOwner(habitId) {
    const { data } = await api.get(`/habits/${habitId}/owner`);
    return data;
  },

  /**
   * Очистить весь кэш
   */
  clearCache() {
    cacheService.clear();
  },

  /**
   * Инвалидировать кэш привычек
   */
  invalidateHabitsCache() {
    cacheService.invalidate('habits_');
  },

  /**
   * Инвалидировать кэш подписки
   */
  invalidateSubscriptionCache() {
    cacheService.invalidate('subscription_');
  }
};

export default habitService;