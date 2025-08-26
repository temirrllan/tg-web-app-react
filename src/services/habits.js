import api from './api';

export const habitService = {
  // Категории
  getCategories: async () => {
    const { data } = await api.get('/categories');
    return data;
  },

  // Все привычки пользователя
  getAllHabits: async () => {
    const { data } = await api.get('/habits');
    console.log('All habits from API:', {
      success: data.success,
      count: data.habits?.length,
      habits: data.habits?.map(h => ({
        id: h.id,
        title: h.title,
        schedule_days: h.schedule_days,
        schedule_type: h.schedule_type,
        is_active: h.is_active
      }))
    });
    return data;
  },

  // Привычки на сегодня (с бэкенда)
  getTodayHabits: async () => {
    const { data } = await api.get('/habits/today');
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    
    console.log('Today habits from API:', {
      today: today.toISOString().split('T')[0],
      dayOfWeek: dayOfWeek,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()],
      count: data?.habits?.length || 0,
      habits: data?.habits?.map(h => ({
        id: h.id,
        title: h.title,
        schedule_days: h.schedule_days,
        today_status: h.today_status
      }))
    });
    return data;
  },

  // Получить привычки для конкретной даты
  getHabitsForDate: async (date) => {
    try {
      const { data } = await api.get(`/habits/date/${date}`);
      console.log(`Habits for date ${date}:`, data);
      return data;
    } catch (error) {
      // Если endpoint не существует, возвращаем null
      console.log('getHabitsForDate not implemented on backend, will filter on frontend');
      return null;
    }
  },

  // Создать привычку
  createHabit: async (habitData) => {
    console.log('Creating habit with data:', {
      ...habitData,
      schedule_days: habitData.schedule_days,
      schedule_type: habitData.schedule_type
    });
    
    const { data } = await api.post('/habits', habitData);
    
    console.log('Created habit response:', {
      success: data.success,
      habit: {
        id: data.habit?.id,
        title: data.habit?.title,
        schedule_days: data.habit?.schedule_days,
        schedule_type: data.habit?.schedule_type
      }
    });
    
    return data;
  },

  // Обновить привычку
  updateHabit: async (id, updates) => {
    const { data } = await api.patch(`/habits/${id}`, updates);
    return data;
  },

  // Удалить привычку
  deleteHabit: async (id) => {
    const { data } = await api.delete(`/habits/${id}`);
    return data;
  },

  // Отметить выполнение/провал
  markHabit: async (id, status = 'completed', date = null) => {
    const markDate = date || new Date().toISOString().split('T')[0];
    console.log('Marking habit:', { id, status, date: markDate });

    const { data } = await api.post(`/habits/${id}/mark`, {
      status,
      date: markDate,
    });
    return data;
  },

  // Снять отметку
  unmarkHabit: async (id, date = null) => {
    const unmarkDate = date || new Date().toISOString().split('T')[0];
    console.log('Unmarking habit:', { id, date: unmarkDate });

    const { data } = await api.delete(`/habits/${id}/mark`, {
      params: { date: unmarkDate },
    });
    return data;
  },
};