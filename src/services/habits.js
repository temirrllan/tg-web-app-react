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
      count: data.habits?.length
    });
    return data;
  },

  // Привычки на сегодня с их статусами
  getTodayHabits: async () => {
    const { data } = await api.get('/habits/today');
    const today = new Date();
    const dayOfWeek = today.getDay() || 7;
    
    console.log('Today habits from API:', {
      today: today.toISOString().split('T')[0],
      dayOfWeek: dayOfWeek,
      count: data?.habits?.length || 0,
      habits: data?.habits?.map(h => ({
        id: h.id,
        title: h.title,
        today_status: h.today_status
      }))
    });
    return data;
  },

  // Получить привычки для конкретной даты с их статусами
  getHabitsForDate: async (date) => {
    try {
      // Сначала получаем все привычки
      const allHabitsResponse = await api.get('/habits');
      const allHabits = allHabitsResponse.data?.habits || [];
      
      // Определяем день недели для фильтрации
      const [year, month, day] = date.split('-');
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      const dayOfWeek = targetDate.getDay() || 7;
      
      // Фильтруем привычки по дню недели
      const filteredHabits = allHabits.filter(habit => {
        if (!habit.schedule_days || habit.schedule_days.length === 0) {
          return true;
        }
        if (habit.schedule_days.length === 7) {
          return true;
        }
        return habit.schedule_days.includes(dayOfWeek);
      });
      
      // Получаем статусы для конкретной даты
      const marksResponse = await api.get(`/habits/marks?date=${date}`);
      const marks = marksResponse.data?.marks || [];
      
      console.log(`Marks for ${date}:`, marks);
      
      // Создаем мапу статусов
      const statusMap = {};
      marks.forEach(mark => {
        if (mark.habit_id && mark.status) {
          statusMap[mark.habit_id] = mark.status;
        }
      });
      
      // Применяем статусы к привычкам
      const habitsWithStatus = filteredHabits.map(habit => ({
        ...habit,
        today_status: statusMap[habit.id] || 'pending',
        status_date: date
      }));
      
      const completedCount = habitsWithStatus.filter(h => h.today_status === 'completed').length;
      
      return {
        habits: habitsWithStatus,
        stats: {
          completed: completedCount,
          total: habitsWithStatus.length
        }
      };
    } catch (error) {
      console.error('getHabitsForDate error:', error);
      
      // Fallback - возвращаем привычки без статусов
      try {
        const allHabitsResponse = await api.get('/habits');
        const allHabits = allHabitsResponse.data?.habits || [];
        
        const [year, month, day] = date.split('-');
        const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
        const dayOfWeek = targetDate.getDay() || 7;
        
        const filteredHabits = allHabits.filter(habit => {
          if (!habit.schedule_days || habit.schedule_days.length === 0) return true;
          if (habit.schedule_days.length === 7) return true;
          return habit.schedule_days.includes(dayOfWeek);
        });
        
        const habitsWithStatus = filteredHabits.map(habit => ({
          ...habit,
          today_status: 'pending',
          status_date: date
        }));
        
        return {
          habits: habitsWithStatus,
          stats: { completed: 0, total: habitsWithStatus.length }
        };
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
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
  updateHabit: async (id, updates) => {
    const { data } = await api.patch(`/habits/${id}`, updates);
    return data;
  },

  // Удалить привычку
  deleteHabit: async (id) => {
    const { data } = await api.delete(`/habits/${id}`);
    return data;
  },

  // Отметить выполнение/провал с указанием даты
  markHabit: async (id, status = 'completed', date = null) => {
    const markDate = date || new Date().toISOString().split('T')[0];
    console.log('Marking habit:', { 
      id, 
      status, 
      date: markDate
    });

    const { data } = await api.post(`/habits/${id}/mark`, {
      status,
      date: markDate,
    });
    
    console.log('Mark habit response:', data);
    return data;
  },

  // Снять отметку с указанием даты
  unmarkHabit: async (id, date = null) => {
    const unmarkDate = date || new Date().toISOString().split('T')[0];
    console.log('Unmarking habit:', { 
      id, 
      date: unmarkDate
    });

    // Передаем дату в query параметрах для DELETE запроса
    const { data } = await api.delete(`/habits/${id}/mark?date=${unmarkDate}`);
    
    console.log('Unmark habit response:', data);
    return data;
  },
};