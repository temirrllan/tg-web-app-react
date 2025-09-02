import api from './api';

export const habitService = {
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

    const { data } = await api.delete(`/habits/${id}/mark?date=${unmarkDate}`);
    
    console.log('Unmark habit response:', data);
    return data;
  },


 // Получить статистику привычки
getHabitStatistics: async (habitId) => {
  try {
    console.log('Getting statistics for habit:', habitId);
    const { data } = await api.get(`/habits/${habitId}/statistics`);
    console.log('Habit statistics response:', data);
    
    if (data.success) {
      return {
        currentStreak: data.currentStreak || 0,
        weekCompleted: data.weekCompleted || 0,
        monthCompleted: data.monthCompleted || 0,
        monthTotal: data.monthTotal || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
        yearCompleted: data.yearCompleted || 0
      };
    }
    
    throw new Error('Failed to get statistics');
  } catch (error) {
    console.error('getHabitStatistics error:', error);
    
    // Возвращаем базовую статистику при ошибке
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    return {
      currentStreak: 0,
      weekCompleted: 0,
      monthCompleted: 0,
      monthTotal: daysInMonth,
      yearCompleted: 0
    };
  }
},
};