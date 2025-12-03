// src/hooks/useHabits.js - МГНОВЕННАЯ ЗАГРУЗКА БЕЗ LOADER

import { useState, useEffect, useCallback, useRef } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(false); // 🔥 НИКОГДА не показываем loader
  const [error, setError] = useState(null);
  
  const isFirstLoad = useRef(true);
  const isMounted = useRef(true);

  /**
   * 🚀 МГНОВЕННАЯ ЗАГРУЗКА - показываем кэш сразу
   */
  const loadTodayHabits = useCallback(async (showLoading = false) => {
    try {
      // 🔥 Loader только для pull-to-refresh
      if (showLoading) {
        setLoading(true);
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`📊 Loading habits for TODAY: ${today}`);
      
      // 🚀 МГНОВЕННО - показываем кэш (даже устаревший)
      const data = await habitService.getTodayHabits();

      if (!isMounted.current) return;

      const normalizedHabits = data?.habits || [];
      const normalizedStats = data?.stats || { 
        completed: normalizedHabits.filter(h => h.today_status === 'completed').length, 
        total: normalizedHabits.length 
      };
      const normalizedPhrase = data?.phrase || { text: '', emoji: '' };

      console.log('✅ Today habits loaded:', {
        date: today,
        count: normalizedHabits.length,
        completed: normalizedStats.completed,
        cached: true
      });

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      setError(null);
      
      isFirstLoad.current = false;
    } catch (err) {
      console.error('❌ loadTodayHabits error:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to load today habits');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadHabitsForDate = useCallback(async (date) => {
    try {
      console.log(`📊 Loading habits for date ${date}`);
      
      const today = new Date().toISOString().split('T')[0];
      
      // 🚀 Загружаем с кэшем (stale-while-revalidate)
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
      if (isMounted.current) {
        setHabits(data.habits || []);
      }
    } catch (err) {
      console.error('❌ loadAllHabits error:', err);
      if (isMounted.current) {
        setError(err.message);
      }
    }
  }, []);

  const markHabit = useCallback(async (habitId, status = 'completed', date) => {
    try {
      vibrate();
      
      if (!date) {
        throw new Error('Date is required for marking habit');
      }
      
      console.log(`✏️ Marking habit ${habitId} as ${status} for ${date}`);
      
      // 🔥 ОПТИМИСТИЧНО обновляем UI МГНОВЕННО
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
      
      // 🌐 Отправляем на сервер (в фоне)
      const result = await habitService.markHabit(habitId, status, date);
      
      console.log('✅ Mark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ markHabit error:', err);
      
      // Откатываем только если запрос не прошёл
      await loadTodayHabits(false);
      
      if (isMounted.current) {
        setError(err.message || 'Failed to mark habit');
      }
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
      
      // 🔥 ОПТИМИСТИЧНО обновляем UI МГНОВЕННО
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
      
      // 🌐 Отправляем на сервер (в фоне)
      const result = await habitService.unmarkHabit(habitId, date);
      
      console.log('✅ Unmark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ unmarkHabit error:', err);
      
      // Откатываем при ошибке
      await loadTodayHabits(false);
      
      if (isMounted.current) {
        setError(err.message || 'Failed to unmark habit');
      }
      throw err;
    }
  }, [loadTodayHabits]);

  const createHabit = useCallback(async (habitData) => {
    try {
      const result = await habitService.createHabit(habitData);
      
      // Обновляем данные после создания (в фоне)
      await Promise.all([
        loadTodayHabits(false),
        loadAllHabits()
      ]);
      
      return result;
    } catch (err) {
      console.error('❌ createHabit error:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to create habit');
      }
      throw err;
    }
  }, [loadTodayHabits, loadAllHabits]);

  const deleteHabit = useCallback(async (habitId) => {
    try {
      await habitService.deleteHabit(habitId);
      
      // Обновляем данные после удаления (в фоне)
      await Promise.all([
        loadAllHabits(),
        loadTodayHabits(false)
      ]);
    } catch (err) {
      console.error('❌ deleteHabit error:', err);
      if (isMounted.current) {
        setError(err.message);
      }
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
    console.log('🔄 Force refresh (clearing cache)');
    habitService.invalidateHabitsCache();
    await loadTodayHabits(true);
  }, [loadTodayHabits]);

  // 🚀 МГНОВЕННАЯ загрузка при монтировании - БЕЗ LOADER
  useEffect(() => {
    console.log('🚀 useHabits mounted - loading data instantly');
    
    isMounted.current = true;
    
    // Загружаем БЕЗ loader
    loadTodayHabits(false);
    loadAllHabits();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadTodayHabits, loadAllHabits]);

  // Автообновление каждые 30 секунд (в фоне, БЕЗ loader)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh (background, no loader)');
      if (isMounted.current) {
        loadTodayHabits(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTodayHabits]);

  // Обновление при возврате на вкладку (БЕЗ loader)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        console.log('👀 Tab became visible, refreshing (no loader)');
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
    loading, // Всегда false, кроме pull-to-refresh
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