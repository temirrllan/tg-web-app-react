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
      const today = new Date().toISOString().split('T')[0];
      console.log(`Loading habits for TODAY: ${today}`);
      
      // ВАЖНО: Всегда загружаем привычки с сервера для сегодня
      const data = await habitService.getTodayHabits();

      const normalizedHabits = data?.habits || [];

      console.log('Today habits loaded:', {
        date: today,
        count: normalizedHabits.length,
        statuses: normalizedHabits.map(h => ({
          id: h.id,
          title: h.title,
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
      setError(null);
    } catch (err) {
      console.error('loadTodayHabits error:', err);
      setError(err.message || 'Failed to load today habits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка привычек для конкретной даты - ВСЕГДА с сервера, без кэширования
  const loadHabitsForDate = useCallback(async (date) => {
    try {
      console.log(`Loading habits for date ${date} from server (no cache)`);
      
      // Если это сегодня - используем специальный эндпоинт для сегодня
      const today = new Date().toISOString().split('T')[0];
      let result;
      
      if (date === today) {
        result = await habitService.getTodayHabits();
      } else {
        result = await habitService.getHabitsForDate(date);
      }
      
      console.log(`Server returned ${result.habits?.length || 0} habits for ${date}:`, {
        date: date,
        statuses: result.habits?.map(h => ({
          id: h.id,
          title: h.title,
          status: h.today_status
        }))
      });
      
      return {
        habits: result.habits || [],
        stats: result.stats || { completed: 0, total: 0 },
        phrase: result.phrase || null
      };
    } catch (err) {
      console.error(`Error loading habits for date ${date}:`, err);
      return { 
        habits: [], 
        stats: { completed: 0, total: 0 },
        phrase: null
      };
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

  // Отметка привычки - ОБЯЗАТЕЛЬНО с датой
  const markHabit = useCallback(async (habitId, status = 'completed', date) => {
    try {
      vibrate();
      
      // КРИТИЧНО: Дата обязательна для отметки
      if (!date) {
        throw new Error('Date is required for marking habit');
      }
      
      console.log(`Marking habit ${habitId} as ${status} for specific date: ${date}`);
      
      // Отправляем запрос на сервер с конкретной датой
      const result = await habitService.markHabit(habitId, status, date);
      
      console.log('Mark habit response:', result);
      
      // Возвращаем результат для обработки в компоненте
      return result;
    } catch (err) {
      console.error('markHabit error:', err);
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, []);

  // Отмена отметки - ОБЯЗАТЕЛЬНО с датой
  const unmarkHabit = useCallback(async (habitId, date) => {
    try {
      vibrate();
      
      // КРИТИЧНО: Дата обязательна для отмены отметки
      if (!date) {
        throw new Error('Date is required for unmarking habit');
      }
      
      console.log(`Unmarking habit ${habitId} for specific date: ${date}`);
      
      // Отправляем запрос на сервер с конкретной датой
      const result = await habitService.unmarkHabit(habitId, date);
      
      console.log('Unmark habit response:', result);
      
      // Возвращаем результат для обработки в компоненте
      return result;
    } catch (err) {
      console.error('unmarkHabit error:', err);
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, []);

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
      
      await loadAllHabits();
      await loadTodayHabits();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  // Перезагрузка данных для конкретной даты
  const refreshDateData = useCallback(async (date) => {
    console.log(`Refreshing data for date: ${date}`);
    const today = new Date().toISOString().split('T')[0];
    
    if (date === today) {
      // Для сегодня обновляем состояние хука
      await loadTodayHabits();
      return {
        habits: todayHabits,
        stats: stats,
        phrase: phrase
      };
    } else {
      // Для других дат просто возвращаем результат загрузки
      return await loadHabitsForDate(date);
    }
  }, [loadTodayHabits, loadHabitsForDate, todayHabits, stats, phrase]);

  // Загрузка при монтировании
  useEffect(() => {
    loadTodayHabits();
    loadAllHabits();
  }, []);

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
    refreshDateData
  };
};