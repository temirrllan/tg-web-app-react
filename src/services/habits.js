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
    const response = await api.post(`/habits/${id}/mark`, { status, date });
    return response.data;
  },

  // Отменить отметку
  unmarkHabit: async (id, date = null) => {
    const params = date ? `?date=${date}` : '';
    const response = await api.delete(`/habits/${id}/mark${params}`);
    return response.data;
  }
};