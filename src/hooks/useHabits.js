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
  
  // Кэш для статусов привычек по датам
  const [habitStatusCache, setHabitStatusCache] = useState({});

  // Загрузка привычек на сегодня
  const loadTodayHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitService.getTodayHabits();

      const normalizedHabits = Array.isArray(data)
        ? data
        : (data?.habits || []);

      console.log('Today habits from server:', {
        count: normalizedHabits.length,
        habits: normalizedHabits.map(h => ({
          title: h.title,
          schedule_days: h.schedule_days,
          today_status: h.today_status
        }))
      });

      const normalizedStats = data?.stats || { 
        completed: normalizedHabits.filter(h => h.today_status === 'completed').length, 
        total: normalizedHabits.length 
      };
      const normalizedPhrase = data?.phrase || { text: '', emoji: '' };

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      
      // Кэшируем статусы для сегодня
      const today = new Date().toISOString().split('T')[0];
      const todayStatuses = {};
      normalizedHabits.forEach(h => {
        todayStatuses[h.id] = h.today_status || 'pending';
      });
      setHabitStatusCache(prev => ({
        ...prev,
        [today]: todayStatuses
      }));
      
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

      // Получаем все привычки пользователя
      const allHabitsData = await habitService.getAllHabits();
      const allHabits = allHabitsData?.habits || [];
      
      // Фильтруем привычки для выбранного дня
      const filteredHabits = allHabits.filter(habit => {
        // Если у привычки нет расписания по дням, показываем каждый день
        if (!habit.schedule_days || habit.schedule_days.length === 0) {
          return true;
        }
        
        // Если schedule_days содержит все дни (1-7), показываем
        if (habit.schedule_days.length === 7) {
          return true;
        }
        
        // Проверяем, входит ли день в расписание
        const included = habit.schedule_days.includes(dayOfWeek);
        console.log(`Habit "${habit.title}" - schedule_days: [${habit.schedule_days}], dayOfWeek: ${dayOfWeek}, included: ${included}`);
        return included;
      });
      
      console.log(`Filtered ${filteredHabits.length} habits for day ${dayOfWeek} (${date})`);
      
      // Получаем статусы для конкретной даты из кэша или с сервера
      let dateStatuses = habitStatusCache[date] || {};
      
      // Если нет в кэше и это не сегодня, пытаемся загрузить с сервера
      const today = new Date().toISOString().split('T')[0];
      if (Object.keys(dateStatuses).length === 0 && date !== today) {
        try {
          // Попытка получить отметки с сервера для конкретной даты
          const marks = await habitService.getHabitMarksForDate(date);
          dateStatuses = marks || {};
          
          // Сохраняем в кэш
          setHabitStatusCache(prev => ({
            ...prev,
            [date]: dateStatuses
          }));
        } catch (error) {
          console.log('Could not load marks for date:', date);
        }
      }
      
      // Применяем статусы к привычкам
      const habitsWithStatus = filteredHabits.map(h => ({
        ...h,
        today_status: dateStatuses[h.id] || 'pending',
        // Добавляем дату для которой загружен статус
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
    } catch (err) {
      console.error('loadHabitsForDate error:', err);
      throw err;
    }
  }, [habitStatusCache]);

  // Загрузка всех привычек
  const loadAllHabits = useCallback(async () => {
    try {
      const data = await habitService.getAllHabits();
      console.log('Loaded all habits:', {
        count: data.habits?.length || 0
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
      
      const markDate = date || new Date().toISOString().split('T')[0];
      console.log('Marking habit in useHabits:', { habitId, status, date: markDate });
      
      await habitService.markHabit(habitId, status, markDate);
      
      // Обновляем кэш статусов
      setHabitStatusCache(prev => ({
        ...prev,
        [markDate]: {
          ...prev[markDate],
          [habitId]: status
        }
      }));
      
      // Если отмечаем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (markDate === today) {
        await loadTodayHabits();
      }
      
      // Возвращаем обновленные данные для выбранной даты
      return await loadHabitsForDate(markDate);
    } catch (err) {
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, [loadTodayHabits, loadHabitsForDate]);

  // Отмена отметки с указанием даты
  const unmarkHabit = useCallback(async (habitId, date = null) => {
    try {
      vibrate();
      
      const unmarkDate = date || new Date().toISOString().split('T')[0];
      console.log('Unmarking habit in useHabits:', { habitId, date: unmarkDate });
      
      await habitService.unmarkHabit(habitId, unmarkDate);
      
      // Обновляем кэш статусов
      setHabitStatusCache(prev => ({
        ...prev,
        [unmarkDate]: {
          ...prev[unmarkDate],
          [habitId]: 'pending'
        }
      }));
      
      // Если отменяем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (unmarkDate === today) {
        await loadTodayHabits();
      }
      
      // Возвращаем обновленные данные для выбранной даты
      return await loadHabitsForDate(unmarkDate);
    } catch (err) {
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, [loadTodayHabits, loadHabitsForDate]);

  // Создание привычки
  const createHabit = useCallback(async (habitData) => {
    try {
      console.log('Creating habit with data:', habitData);
      
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