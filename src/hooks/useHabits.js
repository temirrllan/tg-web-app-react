// src/hooks/useHabits.js - ВСЕГДА загружаем с сервера (БЕЗ начального кэша)

import { useState, useEffect, useCallback, useRef } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

export const useHabits = () => {
  // ✅ Всегда начинаем с пустого состояния - БЕЗ кэша
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  
  // ✅ Всегда показываем loader при первой загрузке
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isFirstLoad = useRef(true);
  const isFetching = useRef(false);
  const lastFetchRef = useRef(null);

  /**
   * 🚀 Загрузка привычек на сегодня
   */
  const loadTodayHabits = useCallback(async (showLoading = false, force = false) => {
    const now = Date.now();
    
    // Предотвращаем частые запросы
    if (!force && lastFetchRef.current && (now - lastFetchRef.current) < 1000) {
      console.log('⚠️ Skipping duplicate fetch (too soon)');
      return;
    }
    
    if (isFetching.current) {
      console.log('⏳ Already fetching, skipping...');
      return;
    }
    
    lastFetchRef.current = now;
    
    try {
      isFetching.current = true;
      
      if (showLoading) {
        setLoading(true);
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`📊 Loading habits for TODAY: ${today}`);
      
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
        completed: normalizedStats.completed
      });

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      setError(null);
      
      isFirstLoad.current = false;
    } catch (err) {
      console.error('❌ loadTodayHabits error:', err);
      
      if (todayHabits.length === 0) {
        setError(err.message || 'Failed to load today habits');
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [todayHabits.length]);

  const loadHabitsForDate = useCallback(async (date) => {
    try {
      console.log(`📊 Loading habits for date ${date}`);
      
      const today = new Date().toISOString().split('T')[0];
      
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
      
      const result = await habitService.markHabit(habitId, status, date);
      
      console.log('✅ Mark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ markHabit error:', err);
      setError(err.message || 'Failed to mark habit');
      throw err;
    }
  }, []);

  const unmarkHabit = useCallback(async (habitId, date) => {
    try {
      vibrate();
      
      if (!date) {
        throw new Error('Date is required for unmarking habit');
      }
      
      console.log(`↩️ Unmarking habit ${habitId} for ${date}`);
      
      const result = await habitService.unmarkHabit(habitId, date);
      
      console.log('✅ Unmark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ unmarkHabit error:', err);
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, []);

  const createHabit = useCallback(async (habitData) => {
    try {
      const result = await habitService.createHabit(habitData);
      
      await Promise.all([
        loadTodayHabits(false, true),
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
      
      await Promise.all([
        loadAllHabits(),
        loadTodayHabits(false, true)
      ]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  const refreshDateData = useCallback(async (date) => {
    console.log(`🔄 Refreshing data for date: ${date}`);
    return await loadHabitsForDate(date);
  }, [loadHabitsForDate]);

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refresh - clearing cache');
    habitService.invalidateHabitsCache();
    lastFetchRef.current = null;
    await loadTodayHabits(true, true);
  }, [loadTodayHabits]);

  // 🚀 Загрузка при монтировании - ВСЕГДА с сервера
  useEffect(() => {
    console.log('📡 Loading habits from server (no cache)...');
    loadTodayHabits(true, true);
    loadAllHabits();
  }, []);

  // Автообновление каждые 30 секунд (в фоне)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh (background)');
      loadTodayHabits(false, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTodayHabits]);

  // Обновление при возврате на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab became visible, refreshing...');
        loadTodayHabits(false, false);
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