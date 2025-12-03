// src/hooks/useHabits.js - МГНОВЕННАЯ ЗАГРУЗКА

import { useState, useEffect, useCallback, useRef } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(false); // 🔥 НЕ показываем loader при загрузке из кэша
  const [error, setError] = useState(null);
  
  const isFirstLoad = useRef(true);

  /**
   * 🚀 МГНОВЕННАЯ ЗАГРУЗКА - без loader
   */
  const loadTodayHabits = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`📊 Loading habits for TODAY: ${today}`);
      
      // 🔥 Загружаем с кэшем - МГНОВЕННО
      const data = await habitService.getTodayHabits();

      const normalizedHabits = data?.habits || [];
      const normalizedStats = data?.stats || { 
        completed: normalizedHabits.filter(h => h.today_status === 'completed').length, 
        total: normalizedHabits.length 
      };
      const normalizedPhrase = data?.phrase || { text: '', emoji: '' };

      console.log('✅ Today habits loaded:', {
        date: today,
        count: normalizedHabits.length,
        fromCache: true
      });

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      setError(null);
      
      isFirstLoad.current = false;
    } catch (err) {
      console.error('❌ loadTodayHabits error:', err);
      setError(err.message || 'Failed to load today habits');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHabitsForDate = useCallback(async (date) => {
    try {
      console.log(`📊 Loading habits for date ${date}`);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Загружаем с кэшем
      const result = date === today 
        ? await habitService.getTodayHabits()
        : await habitService.getHabitsForDate(date);
      
      console.log(`✅ Loaded ${result.habits?.length || 0} habits for ${date}`);
      
      return {
        habits: result.habits || [],
        stats: result.stats || { completed: 0, total: 0 },
        phrase: result.phrase || null
      };
    } catch (err) {
      console.error(`❌ Error loading habits for date ${date}:`, err);
      return { 
        habits: [], 
        stats: { completed: 0, total: 0 },
        phrase: null
      };
    }
  }, []);

  const loadAllHabits = useCallback(async () => {
    try {
      const data = await habitService.getAllHabits();
      setHabits(data.habits || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const markHabit = useCallback(async (habitId, status = 'completed', date) => {
    try {
      vibrate();
      
      if (!date) {
        throw new Error('Date is required for marking habit');
      }
      
      console.log(`✏️ Marking habit ${habitId} as ${status} for ${date}`);
      
      // Оптимистично обновляем UI
      setTodayHabits(prev => {
        return prev.map(h => 
          h.id === habitId 
            ? { ...h, today_status: status }
            : h
        );
      });
      
      // Обновляем статистику
      setStats(prev => {
        const newCompleted = status === 'completed' 
          ? prev.completed + 1 
          : prev.completed;
        return { ...prev, completed: newCompleted };
      });
      
      // Отправляем на сервер
      const result = await habitService.markHabit(habitId, status, date);
      
      console.log('✅ Mark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ markHabit error:', err);
      
      // Откатываем при ошибке
      await loadTodayHabits(false);
      
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, [loadTodayHabits]);

  const unmarkHabit = useCallback(async (habitId, date) => {
    try {
      vibrate();
      
      if (!date) {
        throw new Error('Date is required for unmarking habit');
      }
      
      console.log(`↩️ Unmarking habit ${habitId} for ${date}`);
      
      // Оптимистично обновляем UI
      setTodayHabits(prev => {
        return prev.map(h => 
          h.id === habitId 
            ? { ...h, today_status: 'pending' }
            : h
        );
      });
      
      // Обновляем статистику
      setStats(prev => ({
        ...prev,
        completed: Math.max(0, prev.completed - 1)
      }));
      
      // Отправляем на сервер
      const result = await habitService.unmarkHabit(habitId, date);
      
      console.log('✅ Unmark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ unmarkHabit error:', err);
      
      // Откатываем при ошибке
      await loadTodayHabits(false);
      
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, [loadTodayHabits]);

  const createHabit = useCallback(async (habitData) => {
    try {
      const result = await habitService.createHabit(habitData);
      
      // Обновляем данные после создания
      await Promise.all([
        loadTodayHabits(false),
        loadAllHabits()
      ]);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create habit');
      throw err;
    }
  }, [loadTodayHabits, loadAllHabits]);

  const deleteHabit = useCallback(async (habitId) => {
    try {
      await habitService.deleteHabit(habitId);
      
      // Обновляем данные после удаления
      await Promise.all([
        loadAllHabits(),
        loadTodayHabits(false)
      ]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  const refreshDateData = useCallback(async (date) => {
    console.log(`🔄 Refreshing data for date: ${date}`);
    const today = new Date().toISOString().split('T')[0];
    
    if (date === today) {
      await loadTodayHabits(false);
      return {
        habits: todayHabits,
        stats: stats,
        phrase: phrase
      };
    } else {
      return await loadHabitsForDate(date);
    }
  }, [loadTodayHabits, loadHabitsForDate, todayHabits, stats, phrase]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh');
    habitService.invalidateHabitsCache();
    await loadTodayHabits(true);
  }, [loadTodayHabits]);

  // 🚀 Загрузка при монтировании - БЕЗ LOADER
  useEffect(() => {
    loadTodayHabits(false); // showLoading = false
    loadAllHabits();
  }, [loadTodayHabits, loadAllHabits]);

  // Автообновление каждые 30 секунд (в фоне)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh (background)');
      loadTodayHabits(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTodayHabits]);

  // Обновление при возврате на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab became visible, refreshing...');
        loadTodayHabits(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadTodayHabits]);

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
    refreshDateData,
    forceRefresh
  };
};