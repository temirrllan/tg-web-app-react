import { useState, useEffect, useCallback } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка привычек на сегодня
  const loadTodayHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitService.getTodayHabits();

      const normalizedHabits = Array.isArray(data)
        ? data
        : (data?.habits || data?.items || data?.today || []);

      console.log('Today habits from server:', {
        count: normalizedHabits.length,
        habits: normalizedHabits.map(h => ({
          title: h.title,
          schedule_days: h.schedule_days,
          today_status: h.today_status
        }))
      });

      // Сервер уже должен вернуть отфильтрованные привычки для сегодня
      const today = new Date();
      const currentDayOfWeek = today.getDay() || 7; // 0 (Sunday) = 7
      
      console.log('Today is:', {
        date: today.toISOString().split('T')[0],
        dayOfWeek: currentDayOfWeek,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()]
      });

      const normalizedStats = data?.stats || { 
        completed: normalizedHabits.filter(h => h.today_status === 'completed').length, 
        total: normalizedHabits.length 
      };
      const normalizedPhrase = data?.phrase || { text: '', emoji: '' };

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      setError(null);
    } catch (err) {
      console.error('loadTodayHabits error:', err);
      setError(err.message || 'Failed to load today habits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка привычек для конкретной даты
  const loadHabitsForDate = useCallback(async (date) => {
    try {
      // Создаем дату с полднем для избежания проблем с часовыми поясами
      const [year, month, day] = date.split('-');
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      const dayOfWeek = targetDate.getDay() || 7; // 0 (Sunday) = 7
      
      console.log('Loading habits for date:', {
        date,
        dayOfWeek,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][targetDate.getDay()]
      });

      // Проверяем, есть ли метод на бэкенде для получения привычек по дате
      const dateHabitsResult = await habitService.getHabitsForDate(date);
      
      if (dateHabitsResult) {
        // Если бэкенд поддерживает получение по дате
        const habits = dateHabitsResult.habits || [];
        console.log(`Backend returned ${habits.length} habits for ${date}`);
        
        return {
          habits: habits,
          stats: dateHabitsResult.stats || { 
            completed: habits.filter(h => h.today_status === 'completed').length, 
            total: habits.length 
          }
        };
      }
      
      // Если бэкенд не поддерживает, получаем все привычки и фильтруем на фронте
      const allHabitsData = await habitService.getAllHabits();
      const allHabits = allHabitsData?.habits || [];
      
      console.log('All user habits:', {
        count: allHabits.length,
        habits: allHabits.map(h => ({
          title: h.title,
          schedule_days: h.schedule_days,
          schedule_type: h.schedule_type
        }))
      });
      
      // Фильтруем привычки для выбранного дня
      const filteredHabits = allHabits.filter(habit => {
        // Если у привычки нет расписания по дням, показываем каждый день
        if (!habit.schedule_days || habit.schedule_days.length === 0) {
          console.log(`Habit "${habit.title}" - no schedule, showing every day`);
          return true;
        }
        
        // Если schedule_days содержит все дни (1-7), показываем
        if (habit.schedule_days.length === 7) {
          console.log(`Habit "${habit.title}" - all days scheduled`);
          return true;
        }
        
        // Проверяем, входит ли день в расписание
        const included = habit.schedule_days.includes(dayOfWeek);
        console.log(`Habit "${habit.title}" - schedule_days: [${habit.schedule_days}], dayOfWeek: ${dayOfWeek}, included: ${included}`);
        return included;
      });
      
      console.log(`Filtered ${filteredHabits.length} habits for day ${dayOfWeek} (${date})`);
      
      // Для прошлых дней сбрасываем статусы если это не сегодня
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const isToday = targetDate.toDateString() === today.toDateString();
      
      const habitsWithStatus = filteredHabits.map(h => ({
        ...h,
        today_status: isToday ? h.today_status : 'pending'
      }));
      
      return {
        habits: habitsWithStatus,
        stats: { completed: 0, total: habitsWithStatus.length }
      };
    } catch (err) {
      console.error('loadHabitsForDate error:', err);
      throw err;
    }
  }, []);

  // Загрузка всех привычек
  const loadAllHabits = useCallback(async () => {
    try {
      const data = await habitService.getAllHabits();
      console.log('Loaded all habits:', {
        count: data.habits?.length || 0,
        habits: data.habits?.map(h => ({
          title: h.title,
          schedule_days: h.schedule_days
        }))
      });
      setHabits(data.habits || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Отметка привычки с указанием даты
  const markHabit = useCallback(async (habitId, status = 'completed', date = null) => {
    try {
      vibrate();
      await habitService.markHabit(habitId, status, date);
      
      // Если отмечаем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (!date || date === today) {
        await loadTodayHabits();
      }
    } catch (err) {
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, [loadTodayHabits]);

  // Отмена отметки с указанием даты
  const unmarkHabit = useCallback(async (habitId, date = null) => {
    try {
      vibrate();
      await habitService.unmarkHabit(habitId, date);
      
      // Если отменяем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (!date || date === today) {
        await loadTodayHabits();
      }
    } catch (err) {
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, [loadTodayHabits]);

  // Создание привычки
  const createHabit = useCallback(async (habitData) => {
    try {
      console.log('Creating habit with data:', {
        ...habitData,
        schedule_days: habitData.schedule_days,
        schedule_type: habitData.schedule_type
      });
      
      const result = await habitService.createHabit(habitData);
      
      // Перезагружаем привычки после создания
      await loadTodayHabits();
      await loadAllHabits();
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create habit');
      throw err;
    }
  }, [loadTodayHabits, loadAllHabits]);

  // Удаление привычки
  const deleteHabit = useCallback(async (habitId) => {
    try {
      await habitService.deleteHabit(habitId);
      await loadAllHabits();
      await loadTodayHabits();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  useEffect(() => {
    loadTodayHabits();
    loadAllHabits();
  }, [loadTodayHabits, loadAllHabits]);

  return {
    habits,
    todayHabits,
    stats,
    phrase,
    loading,
    error,
    markHabit,
    unmarkHabit,
    createHabit,
    deleteHabit,
    loadHabitsForDate,
    refresh: loadTodayHabits
  };
};