// src/services/habitsOptimized.js - ВЕРСИЯ 2.0 с stale-while-revalidate

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
  INSTANT: 30 * 1000,       // 30 секунд - для часто меняющихся данных
  FAST: 2 * 60 * 1000,      // 2 минуты - для обычных данных
  MEDIUM: 5 * 60 * 1000,    // 5 минут - для редко меняющихся данных
  SLOW: 15 * 60 * 1000,     // 15 минут - для стабильных данных
  STATIC: 60 * 60 * 1000    // 1 час - для статических данных
};

export const habitService = {
  /**
   * 🚀 Получить привычки на сегодня (МГНОВЕННО с stale-while-revalidate)
   */
  async getTodayHabits(forceRefresh = false) {
    const key = CACHE_KEYS.todayHabits();
    
    return cacheService.fetch(
      key,
      async () => {
        console.log('🌐 Fetching today habits from API...');
        const { data } = await api.get('/habits/today');
        return data;
      },
      { 
        ttl: CACHE_TTL.INSTANT, 
        forceRefresh,
        staleWhileRevalidate: true // 🔥 Показываем старые данные пока грузим новые
      }
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
        console.log(`🌐 Fetching habits for date ${date} from API...`);
        const { data } = await api.get(`/habits/date/${date}`);
        return data;
      },
      { 
        ttl: CACHE_TTL.FAST, 
        forceRefresh,
        staleWhileRevalidate: true
      }
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
        console.log('🌐 Fetching all habits from API...');
        const { data } = await api.get('/habits');
        return data;
      },
      { 
        ttl: CACHE_TTL.FAST, 
        forceRefresh,
        staleWhileRevalidate: true
      }
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
        console.log(`🌐 Fetching statistics for habit ${habitId}...`);
        const { data } = await api.get(`/habits/${habitId}/statistics`);
        return data;
      },
      { 
        ttl: CACHE_TTL.MEDIUM, 
        forceRefresh,
        staleWhileRevalidate: true
      }
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
        console.log(`🌐 Fetching members for habit ${habitId}...`);
        const { data } = await api.get(`/habits/${habitId}/members`);
        return data;
      },
      { 
        ttl: CACHE_TTL.FAST, 
        forceRefresh,
        staleWhileRevalidate: true
      }
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
        console.log('🌐 Fetching categories from API...');
        const { data } = await api.get('/categories');
        return data;
      },
      { 
        ttl: CACHE_TTL.STATIC, 
        forceRefresh,
        staleWhileRevalidate: false // Категории не меняются
      }
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
        console.log('🌐 Fetching user profile from API...');
        const { data } = await api.get('/user/profile');
        return data.user;
      },
      { 
        ttl: CACHE_TTL.SLOW, 
        forceRefresh,
        staleWhileRevalidate: true
      }
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
        console.log('🌐 Checking subscription limits...');
        const { data } = await api.get('/subscription/check');
        return data;
      },
      { 
        ttl: CACHE_TTL.MEDIUM, 
        forceRefresh,
        staleWhileRevalidate: true
      }
    );
  },

  // ============ МЕТОДЫ С ОПТИМИСТИЧНЫМИ ОБНОВЛЕНИЯМИ ============

  /**
   * 🔥 Создать привычку (с оптимистичным обновлением)
   */
  async createHabit(habitData) {
    console.log('➕ Creating habit (optimistic)...');
    
    // Создаём временную привычку для UI
    const tempHabit = {
      id: `temp_${Date.now()}`,
      ...habitData,
      today_status: 'pending',
      created_at: new Date().toISOString()
    };
    
    // Оптимистично обновляем кэш
    const todayKey = CACHE_KEYS.todayHabits();
    const currentData = cacheService.get(todayKey);
    
    if (currentData) {
      const optimisticData = {
        ...currentData,
        habits: [...currentData.habits, tempHabit],
        stats: {
          ...currentData.stats,
          total: currentData.stats.total + 1
        }
      };
      
      cacheService.setOptimistic(todayKey, optimisticData);
    }
    
    try {
      // Отправляем на сервер
      const { data } = await api.post('/habits', habitData);
      
      // Инвалидируем и обновляем кэш
      cacheService.invalidate('habits_');
      cacheService.invalidate('subscription_');
      
      // Загружаем свежие данные в фоне
      this.getTodayHabits(true);
      
      return data;
    } catch (error) {
      // Откатываем оптимистичное обновление
      cacheService.invalidate('habits_');
      throw error;
    }
  },

  /**
   * 🔥 Обновить привычку
   */
  async updateHabit(habitId, updates) {
    console.log(`✏️ Updating habit ${habitId} (optimistic)...`);
    
    // Оптимистично обновляем в кэше
    const todayKey = CACHE_KEYS.todayHabits();
    const currentData = cacheService.get(todayKey);
    
    if (currentData) {
      const optimisticData = {
        ...currentData,
        habits: currentData.habits.map(h =>
          h.id === habitId ? { ...h, ...updates } : h
        )
      };
      
      cacheService.setOptimistic(todayKey, optimisticData);
    }
    
    try {
      const { data } = await api.patch(`/habits/${habitId}`, updates);
      
      // Инвалидируем связанные кэши
      cacheService.invalidate('habits_');
      cacheService.invalidate(`habit_stats_${habitId}`);
      cacheService.invalidate(`habit_members_${habitId}`);
      
      return data;
    } catch (error) {
      // Откатываем
      cacheService.invalidate('habits_');
      throw error;
    }
  },

  /**
   * 🔥 Удалить привычку
   */
  async deleteHabit(habitId) {
    console.log(`🗑️ Deleting habit ${habitId} (optimistic)...`);
    
    // Оптимистично удаляем из кэша
    const todayKey = CACHE_KEYS.todayHabits();
    const currentData = cacheService.get(todayKey);
    
    if (currentData) {
      const optimisticData = {
        ...currentData,
        habits: currentData.habits.filter(h => h.id !== habitId),
        stats: {
          ...currentData.stats,
          total: Math.max(0, currentData.stats.total - 1)
        }
      };
      
      cacheService.setOptimistic(todayKey, optimisticData);
    }
    
    try {
      const { data } = await api.delete(`/habits/${habitId}`);
      
      // Инвалидируем все кэши
      cacheService.invalidate('habits_');
      cacheService.invalidate(`habit_`);
      cacheService.invalidate('subscription_');
      
      return data;
    } catch (error) {
      // Откатываем
      cacheService.invalidate('habits_');
      throw error;
    }
  },

  /**
   * 🔥 Отметить привычку (МГНОВЕННО)
   */
  async markHabit(habitId, status = 'completed', date) {
    const markDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`✅ Marking habit ${habitId} as ${status} (optimistic)`);
    
    // Оптимистично обновляем UI
    const todayKey = CACHE_KEYS.todayHabits();
    const dateKey = CACHE_KEYS.habitsForDate(markDate);
    
    this.updateHabitStatusInCache(todayKey, habitId, status);
    this.updateHabitStatusInCache(dateKey, habitId, status);
    
    try {
      const { data } = await api.post(`/habits/${habitId}/mark`, {
        status,
        date: markDate
      });
      
      // Фоновое обновление
      setTimeout(() => {
        this.getTodayHabits(true);
        if (markDate !== new Date().toISOString().split('T')[0]) {
          this.getHabitsForDate(markDate, true);
        }
      }, 100);
      
      return data;
    } catch (error) {
      console.error('❌ Mark failed, rolling back:', error);
      cacheService.invalidate('habits_');
      throw error;
    }
  },

  /**
   * 🔥 Снять отметку (МГНОВЕННО)
   */
  async unmarkHabit(habitId, date) {
    const unmarkDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`↩️ Unmarking habit ${habitId} (optimistic)`);
    
    // Оптимистично обновляем
    const todayKey = CACHE_KEYS.todayHabits();
    const dateKey = CACHE_KEYS.habitsForDate(unmarkDate);
    
    this.updateHabitStatusInCache(todayKey, habitId, 'pending');
    this.updateHabitStatusInCache(dateKey, habitId, 'pending');
    
    try {
      const { data } = await api.delete(`/habits/${habitId}/mark?date=${unmarkDate}`);
      
      // Фоновое обновление
      setTimeout(() => {
        this.getTodayHabits(true);
        if (unmarkDate !== new Date().toISOString().split('T')[0]) {
          this.getHabitsForDate(unmarkDate, true);
        }
      }, 100);
      
      return data;
    } catch (error) {
      console.error('❌ Unmark failed, rolling back:', error);
      cacheService.invalidate('habits_');
      throw error;
    }
  },

  /**
   * Обновление статуса в кэше (для оптимистичных обновлений)
   */
  updateHabitStatusInCache(cacheKey, habitId, newStatus) {
    const cached = cacheService.get(cacheKey);
    if (!cached || !cached.habits) return;

    const updatedHabits = cached.habits.map(habit => {
      if (habit.id === habitId) {
        return { ...habit, today_status: newStatus };
      }
      return habit;
    });

    const updatedData = {
      ...cached,
      habits: updatedHabits,
      stats: this.recalculateStats(updatedHabits)
    };

    cacheService.setOptimistic(cacheKey, updatedData);
  },

  /**
   * Пересчёт статистики
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
    cacheService.invalidate('user_profile');
    return data;
  },

  /**
   * Присоединиться к привычке
   */
  async joinHabit(shareCode) {
    const { data } = await api.post('/habits/join', { shareCode });
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

  // ============ УТИЛИТЫ ============

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
  },

  /**
   * 🆕 Получить статистику кэша
   */
  getCacheStats() {
    return cacheService.getStats();
  }
};

export default habitService;