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

    // Сервер может вернуть разные формы. Нормализуем:
    const normalizedHabits = Array.isArray(data)
      ? data
      : (data?.habits || data?.items || data?.today || []);

    const normalizedStats = data?.stats || { completed: 0, total: normalizedHabits.length || 0 };
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

  // Загрузка всех привычек
  const loadAllHabits = useCallback(async () => {
    try {
      const data = await habitService.getAllHabits();
      setHabits(data.habits || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);
// Добавьте в хук useHabits
const loadHabitsForDate = useCallback(async (date) => {
  try {
    const response = await habitService.getHabitsForDate(date);
    return response.habits || [];
  } catch (err) {
    console.error('Failed to load habits for date:', err);
    return [];
  }
}, []);
  // Отметка привычки
 // Отметка привычки
const markHabit = useCallback(async (habitId, status = 'completed') => {
  try {
    vibrate();
    await habitService.markHabit(habitId, status);
    await loadTodayHabits();
  } catch (err) {
    setError(err.message || 'Failed to mark habit');
    throw err;
  }
}, [loadTodayHabits]);

  // Отмена отметки
 const unmarkHabit = useCallback(async (habitId) => {
  try {
    vibrate();
    await habitService.unmarkHabit(habitId);
    await loadTodayHabits();
  } catch (err) {
    setError(err.message || 'Failed to unmark habit');
    throw err;
  }
}, [loadTodayHabits]);

  // Создание привычки
const createHabit = useCallback(async (habitData) => {
  try {
    const result = await habitService.createHabit(habitData);
    // После создания — сразу перезагрузить сегодня
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