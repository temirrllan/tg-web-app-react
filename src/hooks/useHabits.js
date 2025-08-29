import { useState, useEffect, useCallback, useRef } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Используем useRef для кэша чтобы избежать лишних рендеров
  const habitStatusCacheRef = useRef({});
  const loadingDatesRef = useRef(new Set());

  // Загрузка привычек на сегодня
  const loadTodayHabits = useCallback(async () => {
    try {
      setLoading(true);
      const data = await habitService.getTodayHabits();

      const normalizedHabits = Array.isArray(data)
        ? data
        : (data?.habits || []);

      console.log('Today habits loaded:', normalizedHabits.length);

      const normalizedStats = data?.stats || { 
        completed: normalizedHabits.filter(h => h.today_status === 'completed').length, 
        total: normalizedHabits.length 
      };
      const normalizedPhrase = data?.phrase || { text: '', emoji: '' };

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      
      // Обновляем кэш для сегодня
      const today = new Date().toISOString().split('T')[0];
      normalizedHabits.forEach(h => {
        const cacheKey = `${today}#${h.id}`;
        habitStatusCacheRef.current[cacheKey] = h.today_status || 'pending';
      });
      
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
    // Предотвращаем множественные загрузки для одной даты
    if (loadingDatesRef.current.has(date)) {
      console.log(`Already loading habits for ${date}, skipping...`);
      return null;
    }
    
    loadingDatesRef.current.add(date);
    
    try {
      const [year, month, day] = date.split('-');
      const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
      const dayOfWeek = targetDate.getDay() || 7;
      
      console.log(`Loading habits for ${date}, day ${dayOfWeek}`);

      // Получаем все привычки пользователя (можно закэшировать)
      const allHabitsData = await habitService.getAllHabits();
      const allHabits = allHabitsData?.habits || [];
      
      // Фильтруем привычки для выбранного дня
      const filteredHabits = allHabits.filter(habit => {
        if (!habit.schedule_days || habit.schedule_days.length === 0) {
          return true;
        }
        
        if (habit.schedule_days.length === 7) {
          return true;
        }
        
        return habit.schedule_days.includes(dayOfWeek);
      });
      
      console.log(`Found ${filteredHabits.length} habits for ${date}`);
      
      // Загружаем статусы с сервера для прошлых дней
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Для сегодня и вчера пытаемся загрузить актуальные статусы
      if (date === today || date === yesterdayStr) {
        try {
          const marks = await habitService.getHabitMarksForDate(date);
          if (marks) {
            Object.entries(marks).forEach(([habitId, status]) => {
              const cacheKey = `${date}#${habitId}`;
              habitStatusCacheRef.current[cacheKey] = status;
            });
          }
        } catch (error) {
          console.log(`Could not load marks for ${date}, using cache`);
        }
      }
      
      // Применяем статусы из кэша
      const habitsWithStatus = filteredHabits.map(h => {
        const cacheKey = `${date}#${h.id}`;
        const cachedStatus = habitStatusCacheRef.current[cacheKey] || 'pending';
        
        return {
          ...h,
          today_status: cachedStatus,
          status_date: date
        };
      });
      
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
    } finally {
      loadingDatesRef.current.delete(date);
    }
  }, []);

  // Загрузка всех привычек
  const loadAllHabits = useCallback(async () => {
    try {
      const data = await habitService.getAllHabits();
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
      console.log(`Marking habit ${habitId} as ${status} for ${markDate}`);
      
      // Сразу обновляем кэш для мгновенного отклика
      const cacheKey = `${markDate}#${habitId}`;
      habitStatusCacheRef.current[cacheKey] = status;
      
      // Отправляем запрос на сервер
      await habitService.markHabit(habitId, status, markDate);
      
      // Если отмечаем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (markDate === today) {
        await loadTodayHabits();
      }
      
      // Возвращаем обновленные данные для выбранной даты
      return await loadHabitsForDate(markDate);
    } catch (err) {
      // Откатываем изменения в кэше при ошибке
      const cacheKey = `${date}#${habitId}`;
      delete habitStatusCacheRef.current[cacheKey];
      
      console.error('markHabit error:', err);
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, [loadTodayHabits, loadHabitsForDate]);

  // Отмена отметки с указанием даты
  const unmarkHabit = useCallback(async (habitId, date = null) => {
    try {
      vibrate();
      
      const unmarkDate = date || new Date().toISOString().split('T')[0];
      console.log(`Unmarking habit ${habitId} for ${unmarkDate}`);
      
      // Сразу обновляем кэш
      const cacheKey = `${unmarkDate}#${habitId}`;
      habitStatusCacheRef.current[cacheKey] = 'pending';
      
      // Отправляем запрос на сервер
      await habitService.unmarkHabit(habitId, unmarkDate);
      
      // Если отменяем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (unmarkDate === today) {
        await loadTodayHabits();
      }
      
      // Возвращаем обновленные данные для выбранной даты
      return await loadHabitsForDate(unmarkDate);
    } catch (err) {
      // Откатываем изменения в кэше при ошибке
      const cacheKey = `${date}#${habitId}`;
      delete habitStatusCacheRef.current[cacheKey];
      
      console.error('unmarkHabit error:', err);
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, [loadTodayHabits, loadHabitsForDate]);

  // Создание привычки
  const createHabit = useCallback(async (habitData) => {
    try {
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
      
      // Очищаем кэш для этой привычки
      Object.keys(habitStatusCacheRef.current).forEach(key => {
        if (key.endsWith(`#${habitId}`)) {
          delete habitStatusCacheRef.current[key];
        }
      });
      
      await loadAllHabits();
      await loadTodayHabits();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  // Очистка кэша
  const clearCache = useCallback(() => {
    console.log('Clearing habit status cache');
    habitStatusCacheRef.current = {};
    loadingDatesRef.current.clear();
  }, []);

  // Проверка флага очистки кэша при монтировании
  useEffect(() => {
    const shouldClearCache = localStorage.getItem('clearHabitCache');
    if (shouldClearCache === 'true') {
      console.log('Clearing cache on mount');
      clearCache();
      localStorage.removeItem('clearHabitCache');
    }
    
    loadTodayHabits();
    loadAllHabits();
  }, []); // Запускаем только при монтировании

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
    refresh: loadTodayHabits,
    clearCache
  };
};