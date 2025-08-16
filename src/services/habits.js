// tg-web-app-react/src/services/habits.js
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
    return data;
  },

  // Привычки на сегодня (с бэкенда)
  getTodayHabits: async () => {
    const { data } = await api.get('/habits/today');
    return data;
  },

  // Создать привычку
  createHabit: async (habitData) => {
    const { data } = await api.post('/habits', habitData);
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

    // Через params — корректно для axios.delete
    const { data } = await api.delete(`/habits/${id}/mark`, {
      params: { date: unmarkDate },
    });
    return data;
  },
};
