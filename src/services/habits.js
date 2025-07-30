import api from './api';

export const habitService = {
  // Получить все категории
  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  // Получить все привычки
  getAllHabits: async () => {
    const response = await api.get('/habits');
    return response.data;
  },

  // Получить привычки на сегодня
  getTodayHabits: async () => {
    const response = await api.get('/habits/today');
    return response.data;
  },

  // Создать привычку
  createHabit: async (habitData) => {
    const response = await api.post('/habits', habitData);
    return response.data;
  },

  // Обновить привычку
  updateHabit: async (id, updates) => {
    const response = await api.patch(`/habits/${id}`, updates);
    return response.data;
  },

  // Удалить привычку
  deleteHabit: async (id) => {
    const response = await api.delete(`/habits/${id}`);
    return response.data;
  },

  // Отметить выполнение
 markHabit: async (id, status = 'completed', date = null) => {
    // Если дата не указана, используем сегодня
    const markDate = date || new Date().toISOString().split('T')[0];
    
    console.log('Marking habit:', { id, status, date: markDate });
    
    const response = await api.post(`/habits/${id}/mark`, { 
      status, 
      date: markDate 
    });
    return response.data;
  },

  // Отменить отметку
  unmarkHabit: async (id, date = null) => {
    // Если дата не указана, используем сегодня
    const unmarkDate = date || new Date().toISOString().split('T')[0];
    
    console.log('Unmarking habit:', { id, date: unmarkDate });
    
    const params = `?date=${unmarkDate}`;
    const response = await api.delete(`/habits/${id}/mark${params}`);
    return response.data;
  }
};