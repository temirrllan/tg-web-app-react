// src/hooks/useHabits.js - МГНОВЕННАЯ ЗАГРУЗКА + ЗАЩИТА ОТ ДУБЛИРОВАНИЯ

import { useState, useEffect, useCallback, useRef } from 'react';
import { habitService } from '../services/habits';
import { vibrate } from '../utils/helpers';

/**
 * 🔥 СИНХРОННАЯ загрузка из localStorage при инициализации
 */
function loadInitialCacheSync() {
  try {
    const cacheKey = 'cache_habits_today';
    const stored = localStorage.getItem(cacheKey);
    
    if (!stored) {
      return null;
    }
    
    const cached = JSON.parse(stored);
    
    // Проверяем свежесть (принимаем даже устаревший кэш)
    const age = Date.now() - (cached.timestamp || 0);
    const maxAge = 10 * 60 * 1000; // 10 минут максимум
    
    if (age > maxAge) {
      console.log('⚠️ Cache too old, skipping');
      return null;
    }
    
    console.log('✅ INSTANT LOAD from localStorage:', {
      habits: cached.data?.habits?.length || 0,
      age: Math.round(age / 1000) + 's'
    });
    
    return cached.data;
  } catch (error) {
    console.error('❌ Failed to load initial cache:', error);
    return null;
  }
}

export const useHabits = () => {
  // 🔥 МГНОВЕННАЯ инициализация из кэша
  const initialCache = loadInitialCacheSync();
  
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState(initialCache?.habits || []);
  const [stats, setStats] = useState(initialCache?.stats || { completed: 0, total: 0 });
  const [phrase, setPhrase] = useState(initialCache?.phrase || { text: '', emoji: '' });
  
  // 🔥 НЕ показываем loader если есть кэш
  const [loading, setLoading] = useState(!initialCache);
  const [error, setError] = useState(null);
  
  const isFirstLoad = useRef(true);
  const isFetching = useRef(false);
  const lastFetchRef = useRef(null); // 🆕 Для предотвращения дублирования запросов

  /**
   * 🚀 Фоновая загрузка (без блокировки UI)
   */
  const loadTodayHabits = useCallback(async (showLoading = false, force = false) => {
    const now = Date.now();
    
    // 🆕 Предотвращаем частые запросы (не чаще 1 раза в секунду)
    if (!force && lastFetchRef.current && (now - lastFetchRef.current) < 1000) {
      console.log('⚠️ Skipping duplicate fetch (too soon)');
      return;
    }
    
    // Предотвращаем дублирование запросов
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
        completed: normalizedStats.completed
      });

      setTodayHabits(normalizedHabits);
      setStats(normalizedStats);
      setPhrase(normalizedPhrase);
      setError(null);
      
      isFirstLoad.current = false;
    } catch (err) {
      console.error('❌ loadTodayHabits error:', err);
      
      // При ошибке НЕ стираем кэш
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
      
      const today = new Date().toISOString().split('T')[0];
      
      // 🆕 ВАЖНО: Обновляем todayHabits ТОЛЬКО если это сегодня
      if (date === today) {
        // Оптимистично обновляем UI для сегодня
        setTodayHabits(prev => {
          return prev.map(h => 
            h.id === habitId 
              ? { ...h, today_status: status }
              : h
          );
        });
        
        // Обновляем статистику
        setStats(prev => {
          const currentHabit = prev.completed;
          const newCompleted = status === 'completed' 
            ? currentHabit + 1 
            : currentHabit;
          return { ...prev, completed: newCompleted };
        });
      } else {
        // Для других дат - НЕ трогаем todayHabits
        console.log(`✅ Marking for ${date} (not today), skipping UI update`);
      }
      
      // Отправляем на сервер
      const result = await habitService.markHabit(habitId, status, date);
      
      console.log('✅ Mark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ markHabit error:', err);
      
      // 🆕 Откатываем ТОЛЬКО для сегодня
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        await loadTodayHabits(false);
      }
      
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
      
      const today = new Date().toISOString().split('T')[0];
      
      // 🆕 ВАЖНО: Обновляем todayHabits ТОЛЬКО если это сегодня
      if (date === today) {
        // Оптимистично обновляем UI для сегодня
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
      } else {
        // Для других дат - НЕ трогаем todayHabits
        console.log(`✅ Unmarking for ${date} (not today), skipping UI update`);
      }
      
      // Отправляем на сервер
      const result = await habitService.unmarkHabit(habitId, date);
      
      console.log('✅ Unmark habit response:', result);
      
      return result;
    } catch (err) {
      console.error('❌ unmarkHabit error:', err);
      
      // 🆕 Откатываем ТОЛЬКО для сегодня
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        await loadTodayHabits(false);
      }
      
      setError(err.message || 'Failed to unmark habit');
      throw err;
    }
  }, [loadTodayHabits]);

  const createHabit = useCallback(async (habitData) => {
    try {
      const result = await habitService.createHabit(habitData);
      
      // Обновляем данные после создания
      await Promise.all([
        loadTodayHabits(false, true), // force = true
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
        loadTodayHabits(false, true) // force = true
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
      await loadTodayHabits(false, true); // force = true
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
    console.log('🔄 Force refresh - clearing cache');
    habitService.invalidateHabitsCache();
    lastFetchRef.current = null; // 🆕 Сбрасываем защиту
    await loadTodayHabits(true, true); // showLoading = true, force = true
  }, [loadTodayHabits]);

  // 🚀 Загрузка при монтировании
  useEffect(() => {
    // Если уже есть кэш - загружаем в фоне
    if (initialCache) {
      console.log('⚡ Initial cache loaded, fetching updates in background...');
      loadTodayHabits(false, false); // showLoading = false, force = false
    } else {
      // Если нет кэша - показываем loader
      console.log('📡 No cache, loading with loader...');
      loadTodayHabits(true, false); // showLoading = true, force = false
    }
    
    loadAllHabits();
  }, []); // Пустой массив - выполняем только один раз

  // Автообновление каждые 30 секунд (в фоне)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh (background)');
      loadTodayHabits(false, false); // showLoading = false, force = false
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTodayHabits]);

  // Обновление при возврате на вкладку
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab became visible, refreshing...');
        loadTodayHabits(false, false); // showLoading = false, force = false
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
    loading, // Будет false если есть initialCache
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