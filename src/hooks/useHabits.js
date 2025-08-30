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
        : (data?.habits || []);

      console.log('Today habits loaded:', {
        count: normalizedHabits.length,
        date: new Date().toISOString().split('T')[0],
        statuses: normalizedHabits.map(h => ({
          id: h.id,
          title: h.title,
          status: h.today_status
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

  // Загрузка привычек для конкретной даты - всегда загружаем с сервера
  const loadHabitsForDate = useCallback(async (date) => {
    try {
      console.log(`Loading habits for ${date} from server`);
      
      // Всегда загружаем актуальные данные с сервера
      const result = await habitService.getHabitsForDate(date);
      
      console.log(`Loaded ${result.habits?.length || 0} habits for ${date}:`, {
        statuses: result.habits?.map(h => ({
          id: h.id,
          title: h.title,
          status: h.today_status
        }))
      });
      
      return result;
    } catch (err) {
      console.error('loadHabitsForDate error:', err);
      return { habits: [], stats: { completed: 0, total: 0 } };
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

  // Отметка привычки с ОБЯЗАТЕЛЬНЫМ указанием даты
  const markHabit = useCallback(async (habitId, status = 'completed', date) => {
    try {
      vibrate();
      
      // Дата обязательна
      if (!date) {
        throw new Error('Date is required for marking habit');
      }
      
      console.log(`Marking habit ${habitId} as ${status} for date ${date}`);
      
      // Отправляем запрос на сервер с конкретной датой
      await habitService.markHabit(habitId, status, date);
      
      // Если отмечаем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        console.log('Reloading today habits after marking');
        await loadTodayHabits();
      }
      
      // Не возвращаем результат здесь, пусть компонент сам перезагрузит данные
    } catch (err) {
      console.error('markHabit error:', err);
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, [loadTodayHabits]);

  // Отмена отметки с ОБЯЗАТЕЛЬНЫМ указанием даты
  const unmarkHabit = useCallback(async (habitId, date) => {
    try {
      vibrate();
      
      // Дата обязательна
      if (!date) {
        throw new Error('Date is required for unmarking habit');
      }
      
      console.log(`Unmarking habit ${habitId} for date ${date}`);
      
      // Отправляем запрос на сервер с конкретной датой
      await habitService.unmarkHabit(habitId, date);
      
      // Если отменяем сегодня, перезагружаем сегодняшние привычки
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        console.log('Reloading today habits after unmarking');
        await loadTodayHabits();
      }
      
      // Не возвращаем результат здесь, пусть компонент сам перезагрузит данные
    } catch (err) {
      console.error('unmarkHabit error:', err);
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, [loadTodayHabits]);

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

  // Очистка кэша (теперь просто перезагружает данные)
  const clearCache = useCallback(() => {
    console.log('Refreshing all data from server');
    loadTodayHabits();
    loadAllHabits();
  }, [loadTodayHabits, loadAllHabits]);

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
    clearCache
  };
};