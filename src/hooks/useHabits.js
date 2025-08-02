import { useState, useEffect, useCallback } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

// Вынесем отображение ошибок в отдельную функцию, вместо alert лучше использовать кастомные уведомления (пока alert)
const handleError = (error, setError) => {
  const message = error?.response?.data?.error || error.message || 'Unknown error';
  setError(message);
  alert(`Error: ${message}`);
};

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTodayHabits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await habitService.getTodayHabits();
      setTodayHabits(data.habits || []);
      setStats(data.stats || { completed: 0, total: 0 });
      setPhrase(data.phrase || { text: '', emoji: '' });
    } catch (err) {
      handleError(err, setError);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllHabits = useCallback(async () => {
    try {
      setError(null);
      const data = await habitService.getAllHabits();
      setHabits(data.habits || []);
    } catch (err) {
      handleError(err, setError);
    }
  }, []);

  const markHabit = useCallback(async (habitId, status = 'completed') => {
    try {
      vibrate();
      setError(null);
      await habitService.markHabit(habitId, status);
      await loadTodayHabits();
    } catch (err) {
      handleError(err, setError);
      throw err;
    }
  }, [loadTodayHabits]);

  const unmarkHabit = useCallback(async (habitId) => {
    try {
      vibrate();
      setError(null);
      await habitService.unmarkHabit(habitId);
      await loadTodayHabits();
    } catch (err) {
      handleError(err, setError);
      throw err;
    }
  }, [loadTodayHabits]);

  const createHabit = useCallback(async (habitData) => {
    try {
      setError(null);
      const result = await habitService.createHabit(habitData);
      await loadAllHabits();
      await loadTodayHabits();
      return result;
    } catch (err) {
      handleError(err, setError);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  const deleteHabit = useCallback(async (habitId) => {
    try {
      setError(null);
      await habitService.deleteHabit(habitId);
      await loadAllHabits();
      await loadTodayHabits();
    } catch (err) {
      handleError(err, setError);
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
    refresh: loadTodayHabits
  };
};
