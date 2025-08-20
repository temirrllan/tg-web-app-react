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
      // Если есть метод на бэкенде
      if (habitService.getHabitsForDate) {
        const data = await habitService.getHabitsForDate(date);
        const habits = data?.habits || [];
        const stats = {
          completed: habits.filter(h => h.today_status === 'completed').length,
          total: habits.length
        };
        return { habits, stats };
      }
      
      // Иначе возвращаем привычки без статусов
      return {
        habits: todayHabits.map(h => ({
          ...h,
          today_status: 'pending'
        })),
        stats: { completed: 0, total: todayHabits.length }
      };
    } catch (err) {
      console.error('loadHabitsForDate error:', err);
      throw err;
    }
  }, [todayHabits]);

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
      const result = await habitService.createHabit(habitData);
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