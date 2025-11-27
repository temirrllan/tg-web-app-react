import api from './api';

export const habitService = {
  // ============ МЕТОДЫ С КЭШИРОВАНИЕМ ============
  
  /**
   * Получить категории (кэшируется на 30 минут)
   */
  async getCategories() {
    return await cachedApi.getCategories();
  },

  /**
   * Получить все привычки (кэшируется на 2 минуты)
   */
  async getAllHabits() {
    return await cachedApi.getAllHabits();
  },

  /**
   * Получить привычки на сегодня (кэшируется на 1 минуту)
   */
  async getTodayHabits() {
    return await cachedApi.getTodayHabits();
  },

  /**
   * Получить привычки для конкретной даты (кэшируется на 2 минуты)
   */
  async getHabitsForDate(date) {
    return await cachedApi.getHabitsForDate(date);
  },

  /**
   * Получить статистику привычки (кэшируется на 5 минут)
   */
  async getHabitStatistics(habitId) {
    return await cachedApi.getHabitStatistics(habitId);
  },

  /**
   * Получить участников привычки (кэшируется на 2 минуты)
   */
  async getHabitMembers(habitId) {
    return await cachedApi.getHabitMembers(habitId);
  },

  /**
   * Получить профиль пользователя (кэшируется на 10 минут)
   */
  async getUserProfile() {
    return await cachedApi.getUserProfile();
  },

  /**
   * Проверить лимиты подписки (кэшируется на 5 минут)
   */
  async checkSubscriptionLimits() {
    return await cachedApi.checkSubscriptionLimits();
  },

  // ============ МЕТОДЫ БЕЗ КЭШИРОВАНИЯ (изменяют данные) ============

  /**
   * Создать привычку (инвалидирует кэш)
   */
  async createHabit(habitData) {
    return await cachedApi.createHabit(habitData);
  },

  /**
   * Обновить привычку (инвалидирует кэш)
   */
  async updateHabit(habitId, updates) {
    return await cachedApi.updateHabit(habitId, updates);
  },

  /**
   * Удалить привычку (инвалидирует кэш)
   */
  async deleteHabit(habitId) {
    return await cachedApi.deleteHabit(habitId);
  },

  /**
   * Отметить привычку (инвалидирует кэш)
   */
  async markHabit(habitId, status = 'completed', date = null) {
    return await cachedApi.markHabit(habitId, status, date);
  },

  /**
   * Снять отметку (инвалидирует кэш)
   */
  async unmarkHabit(habitId, date) {
    return await cachedApi.unmarkHabit(habitId, date);
  },

  /**
   * Обновить язык пользователя (инвалидирует кэш)
   */
  async updateUserLanguage(language) {
    return await cachedApi.updateUserLanguage(language);
  },
  // Категории
  getCategories: async () => {
    const { data } = await api.get('/categories');
    return data;
  },

  // Все привычки пользователя (без статусов)
  getAllHabits: async () => {
    const { data } = await api.get('/habits');
    console.log('All habits from API:', {
      success: data.success,
      count: data.habits?.length
    });
    return data;
  },

  // Привычки на сегодня с их статусами для сегодняшнего дня
  getTodayHabits: async () => {
    const { data } = await api.get('/habits/today');
    const today = new Date();
    
    console.log('Today habits from API:', {
      date: today.toISOString().split('T')[0],
      count: data?.habits?.length || 0,
      statuses: data?.habits?.map(h => ({
        id: h.id,
        title: h.title,
        today_status: h.today_status
      }))
    });
    return data;
  },

  // Получить привычки для конкретной даты с их статусами для этой даты
  getHabitsForDate: async (date) => {
    try {
      console.log(`Getting habits for date ${date}`);
      
      // Используем новый эндпоинт который возвращает привычки со статусами для конкретной даты
      const { data } = await api.get(`/habits/date/${date}`);
      
      console.log(`Habits for ${date}:`, {
        count: data.habits?.length,
        statuses: data.habits?.map(h => ({
          id: h.id,
          title: h.title,
          today_status: h.today_status
        }))
      });
      
      return data;
    } catch (error) {
      console.error('getHabitsForDate error:', error);
      
      // Fallback - получаем привычки и отметки отдельно
      try {
        // Получаем все привычки
        const habitsResponse = await api.get('/habits');
        const allHabits = habitsResponse.data?.habits || [];
        
        // Фильтруем по дню недели
        const [year, month, day] = date.split('-');
        const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        const dayOfWeek = targetDate.getDay() || 7;
        
        const filteredHabits = allHabits.filter(habit => {
          if (!habit.schedule_days || habit.schedule_days.length === 0) return true;
          if (habit.schedule_days.length === 7) return true;
          return habit.schedule_days.includes(dayOfWeek);
        });
        
        // Получаем отметки для этой даты
        try {
          const marksResponse = await api.get(`/habits/marks?date=${date}`);
          const marks = marksResponse.data?.marks || [];
          
          // Создаем мапу статусов
          const statusMap = {};
          marks.forEach(mark => {
            statusMap[mark.habit_id] = mark.status;
          });
          
          // Применяем статусы
          const habitsWithStatus = filteredHabits.map(h => ({
            ...h,
            today_status: statusMap[h.id] || 'pending'
          }));
          
          const completedCount = habitsWithStatus.filter(h => h.today_status === 'completed').length;
          
          return {
            habits: habitsWithStatus,
            stats: {
              completed: completedCount,
              total: habitsWithStatus.length
            }
          };
        } catch (marksError) {
          console.log('Could not load marks, returning habits without statuses');
          
          const habitsWithStatus = filteredHabits.map(h => ({
            ...h,
            today_status: 'pending'
          }));
          
          return {
            habits: habitsWithStatus,
            stats: { completed: 0, total: habitsWithStatus.length }
          };
        }
      } catch (fallbackError) {
        console.error('Complete failure:', fallbackError);
        return { habits: [], stats: { completed: 0, total: 0 } };
      }
    }
  },

  // Создать привычку
  createHabit: async (habitData) => {
    console.log('Creating habit with data:', habitData);
    const { data } = await api.post('/habits', habitData);
    console.log('Created habit response:', data);
    return data;
  },

  // Обновить привычку
  // Обновить привычку
updateHabit: async (id, updates) => {
  try {
    console.log('Updating habit:', { id, updates });
    const { data } = await api.patch(`/habits/${id}`, updates);
    
    // Проверяем, является ли пользователь владельцем
    if (!data.success && data.isOwner === false) {
      throw new Error('Only the habit creator can edit this habit');
    }
    
    return data;
  } catch (error) {
    console.error('updateHabit error:', error);
    
    // Если это ошибка прав доступа - пробрасываем специальное сообщение
    if (error.response?.status === 403) {
      throw new Error(error.response.data?.error || 'Only the habit creator can edit this habit');
    }
    
    throw error;
  }
},

  // Удалить привычку
  deleteHabit: async (id) => {
    const { data } = await api.delete(`/habits/${id}`);
    return data;
  },

// Отметить выполнение/провал с указанием даты
markHabit: async (id, status = 'completed', date = null) => {
  // ВАЖНО: Всегда передаем дату в формате YYYY-MM-DD
  const markDate = date || new Date().toISOString().split('T')[0];
  
  console.log('Marking habit from frontend:', { 
    id, 
    status, 
    date: markDate,
    originalDate: date
  });

  const { data } = await api.post(`/habits/${id}/mark`, {
    status,
    date: markDate, // Явно передаем дату
  });
  
  console.log('Mark habit response:', data);
  return data;
},

 // Снять отметку с указанием даты
unmarkHabit: async (id, date = null) => {
  // ВАЖНО: Всегда передаем дату в формате YYYY-MM-DD
  const unmarkDate = date || new Date().toISOString().split('T')[0];
  
  console.log('Unmarking habit from frontend:', { 
    id, 
    date: unmarkDate,
    originalDate: date
  });

  const { data } = await api.delete(`/habits/${id}/mark?date=${unmarkDate}`);
  
  console.log('Unmark habit response:', data);
  return data;
},
// Проверка лимитов подписки
checkSubscriptionLimits: async () => {
  try {
    const { data } = await api.get('/subscription/check');
    console.log('Subscription limits:', data);
    return data;
  } catch (error) {
    console.error('checkSubscriptionLimits error:', error);
    return {
      success: false,
      habitCount: 0,
      limit: 3,
      isPremium: false,
      canCreateMore: true
    };
  }
},
// Получить историю подписок
getSubscriptionHistory: async () => {
  try {
    const { data } = await api.get('/subscription/history');
    return data;
  } catch (error) {
    console.error('getSubscriptionHistory error:', error);
    return { success: false, history: [] };
  }
},

// Отменить подписку
// В файле src/services/habits.js обновите метод cancelSubscription:

// В файле src/services/habits.js обновите метод cancelSubscription:

cancelSubscription: async () => {
  try {
    console.log('Calling cancel subscription API...');
    const { data } = await api.post('/subscription/cancel');
    console.log('Cancel subscription response:', data);
    
    return data;
  } catch (error) {
    console.error('cancelSubscription API error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Проверяем разные типы ошибок
    if (error.response) {
      // Сервер ответил с ошибкой
      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || 'Server error'
      };
    } else if (error.request) {
      // Запрос был отправлен, но ответа не получено
      return {
        success: false,
        error: 'No response from server. Please check your connection.'
      };
    } else {
      // Что-то произошло при настройке запроса
      return {
        success: false,
        error: error.message || 'Failed to cancel subscription'
      };
    }
  }
},

// Получить доступные планы
getSubscriptionPlans: async () => {
  try {
    const { data } = await api.get('/subscription/plans');
    return data;
  } catch (error) {
    console.error('getSubscriptionPlans error:', error);
    return { success: false, plans: [] };
  }
},
// Активация премиум подписки
activatePremium: async (plan) => {
  try {
    const { data } = await api.post('/subscription/activate', { plan });
    console.log('Premium activation result:', data);
    return data;
  } catch (error) {
    console.error('activatePremium error:', error);
    throw error;
  }
},
// Добавьте в src/services/habits.js

// В конец объекта habitService добавьте:

// Получить профиль пользователя
getUserProfile: async () => {
    try {
      const { data } = await api.get('/user/profile');
      return data.user;
    } catch (error) {
      console.error('getUserProfile error:', error);
      return null;
    }
  },
// Обновить язык пользователя
  updateUserLanguage: async (language) => {
    try {
      const { data } = await api.patch('/user/language', { language });
      console.log('Language updated:', data);
      return data;
    } catch (error) {
      console.error('updateUserLanguage error:', error);
      throw error;
    }
  },
  getHabitStatistics: async (habitId) => {
  try {
    const { data } = await api.get(`/habits/${habitId}/statistics`);
    console.log('Habit statistics:', data);
    return data;
  } catch (error) {
    console.error('getHabitStatistics error:', error);
    
    // Fallback - возвращаем базовую статистику
    return {
      currentStreak: 0,
      weekCompleted: 0,
      monthCompleted: 0,
      yearCompleted: 0,
      monthTotal: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    };
  }
},

// Создать ссылку для шаринга
createShareLink: async (habitId) => {
  const { data } = await api.post(`/habits/${habitId}/share`);
  return data;
},

// Получить участников привычки
getHabitMembers: async (habitId) => {
  const { data } = await api.get(`/habits/${habitId}/members`);
  return data;
},

// Punch друга
punchFriend: async (habitId, userId) => {
  const { data } = await api.post(`/habits/${habitId}/punch/${userId}`);
  return data;
},

// Удалить участника
removeMember: async (habitId, userId) => {
  const { data } = await api.delete(`/habits/${habitId}/members/${userId}`);
  return data;
},

// Присоединиться к привычке по коду
joinHabit: async (shareCode) => {
  const { data } = await api.post('/habits/join', { shareCode });
  return data;
},
// Проверить лимит на добавление друзей
checkFriendLimit: async (habitId) => {
  try {
    const { data } = await api.get(`/habits/${habitId}/check-friend-limit`);
    console.log('Friend limit check:', data);
    return data;
  } catch (error) {
    console.error('checkFriendLimit error:', error);
    return {
      success: false,
      canAddFriend: false,
      showPremiumModal: true
    };
  }
},

// Удалить участника (обновленный метод)
removeMember: async (habitId, userId) => {
  try {
    const { data } = await api.delete(`/habits/${habitId}/members/${userId}`);
    console.log('Member removed:', data);
    return data;
  } catch (error) {
    console.error('removeMember error:', error);
    throw error;
  }
},
// Получить информацию о владельце привычки
  getHabitOwner: async (habitId) => {
    try {
      const { data } = await api.get(`/habits/${habitId}/owner`);
      console.log('✅ Habit owner info from API:', data);
      return data;
    } catch (error) {
      console.error('❌ getHabitOwner error:', error);
      return null;
    }
  },
// Получить информацию о владельце привычки
getHabitOwnerInfo: async (habitId) => {
  try {
    const { data } = await api.get(`/habits/${habitId}/owner`);
    console.log('Owner info from API:', data);
    return data;
  } catch (error) {
    console.error('getHabitOwnerInfo error:', error);
    return { success: false };
  }
},
joinHabit: async (shareCode) => {
    console.log('🔄 Attempting to join habit with code:', shareCode);
    try {
      const { data } = await api.post('/habits/join', { shareCode });
      console.log('✅ Join habit response:', data);
      return data;
    } catch (error) {
      console.error('❌ Join habit error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
  // ============ УТИЛИТЫ ============

  /**
   * Очистить весь кэш
   */
  clearCache() {
    cachedApi.clearAllCache();
  },

  /**
   * Инвалидировать кэш привычек
   */
  invalidateHabitsCache() {
    cachedApi.invalidateHabitsCache();
  },

  /**
   * Инвалидировать кэш подписки
   */
  invalidateSubscriptionCache() {
    cachedApi.invalidateSubscriptionCache();
  }
};