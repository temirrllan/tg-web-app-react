// src/hooks/useHabitsOptimized.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { habitServiceOptimized } from '../services/habitsOptimized';
import { vibrate } from '../utils/helpers';

export const useHabitsOptimized = () => {
  const [habits, setHabits] = useState([]);
  const [todayHabits, setTodayHabits] = useState([]);
  const [stats, setStats] = useState({ completed: 0, total: 0 });
  const [phrase, setPhrase] = useState({ text: '', emoji: '' });
  const [loading, setLoading] = useState(false); // Не показываем загрузку при кэше
  const [error, setError] = useState(null);
  
  const isInitialMount = useRef(true);
  const lastLoadTime = useRef(0);

  /**
   * Загрузка привычек на сегодня (с кэшем)
   */
  const loadTodayHabits = useCallback(async (forceRefresh = false) => {
    try {
      // Показываем загрузку только при первом монтировании без кэша
      if (isInitialMount.current && todayHabits.length === 0) {
        setLoading(true);
      }
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`📊 Loading habits for TODAY: ${today}`);
      
      // Stale-While-Revalidate: получаем данные из кэша мгновенно
      const data = await habitServiceOptimized.getTodayHabits(forceRefresh);

      if (data) {
        const normalizedHabits = data.habits || [];
        const normalizedStats = data.stats || { 
          completed: normalizedHabits.filter(h => h.today_status === 'completed').length, 
          total: normalizedHabits.length 
        };
        const normalizedPhrase = data.phrase || { text: '', emoji: '' };

        console.log(`✅ Loaded ${normalizedHabits.length} habits for today`);

        setTodayHabits(normalizedHabits);
        setStats(normalizedStats);
        setPhrase(normalizedPhrase);
        setError(null);
        
        lastLoadTime.current = Date.now();
      }
    } catch (err) {
      console.error('loadTodayHabits error:', err);
      setError(err.message || 'Failed to load today habits');
    } finally {
      setLoading(false);
      isInitialMount.current = false;
    }
  }, [todayHabits.length]);

  /**
   * Загрузка привычек для конкретной даты (с кэшем)
   */
  const loadHabitsForDate = useCallback(async (date, forceRefresh = false) => {
    try {
      console.log(`📊 Loading habits for date ${date}`);
      
      const result = await habitServiceOptimized.getHabitsForDate(date, forceRefresh);
      
      console.log(`✅ Server returned ${result.habits?.length || 0} habits for ${date}`);
      
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

  /**
   * Загрузка всех привычек (с кэшем)
   */
  const loadAllHabits = useCallback(async () => {
    try {
      const data = await habitServiceOptimized.getAllHabits();
      setHabits(data.habits || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  /**
   * Отметка привычки - ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ
   */
  const markHabit = useCallback(async (habitId, status = 'completed', date) => {
    try {
      vibrate();
      
      if (!date) {
        throw new Error('Date is required for marking habit');
      }
      
      console.log(`✅ Marking habit ${habitId} as ${status} for ${date}`);
      
      // 🚀 ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ - обновляем UI сразу
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        setTodayHabits(prev => 
          prev.map(h => 
            h.id === habitId 
              ? { ...h, today_status: status }
              : h
          )
        );
        
        // Обновляем статистику
        setStats(prev => {
          const newHabits = todayHabits.map(h => 
            h.id === habitId ? { ...h, today_status: status } : h
          );
          const completed = newHabits.filter(h => h.today_status === 'completed').length;
          return { completed, total: newHabits.length };
        });
      }
      
      // Отправляем на сервер
      const result = await habitServiceOptimized.markHabit(habitId, status, date);
      
      // Обновляем из ответа сервера (для синхронизации)
      if (date === today) {
        await loadTodayHabits();
      }
      
      return result;
    } catch (err) {
      console.error('markHabit error:', err);
      // Откатываем оптимистичное обновление
      await loadTodayHabits(true);
      throw err;
    }
  }, [loadTodayHabits, todayHabits]);

  /**
   * Отмена отметки - ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ
   */
  const unmarkHabit = useCallback(async (habitId, date) => {
    try {
      vibrate();
      
      if (!date) {
        throw new Error('Date is required for unmarking habit');
      }
      
      console.log(`🔄 Unmarking habit ${habitId} for ${date}`);
      
      // 🚀 ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        setTodayHabits(prev => 
          prev.map(h => 
            h.id === habitId 
              ? { ...h, today_status: 'pending' }
              : h
          )
        );
        
        setStats(prev => {
          const newHabits = todayHabits.map(h => 
            h.id === habitId ? { ...h, today_status: 'pending' } : h
          );
          const completed = newHabits.filter(h => h.today_status === 'completed').length;
          return { completed, total: newHabits.length };
        });
      }
      
      const result = await habitServiceOptimized.unmarkHabit(habitId, date);
      
      if (date === today) {
        await loadTodayHabits();
      }
      
      return result;
    } catch (err) {
      console.error('unmarkHabit error:', err);
      await loadTodayHabits(true);
      throw err;
    }
  }, [loadTodayHabits, todayHabits]);

  /**
   * Создание привычки
   */
  const createHabit = useCallback(async (habitData) => {
    try {
      const result = await habitServiceOptimized.createHabit(habitData);
      
      // Обновляем данные
      await Promise.all([
        loadTodayHabits(true),
        loadAllHabits()
      ]);
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create habit');
      throw err;
    }
  }, [loadTodayHabits, loadAllHabits]);

  /**
   * Удаление привычки
   */
  const deleteHabit = useCallback(async (habitId) => {
    try {
      await habitServiceOptimized.deleteHabit(habitId);
      
      await Promise.all([
        loadAllHabits(),
        loadTodayHabits(true)
      ]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [loadAllHabits, loadTodayHabits]);

  /**
   * Перезагрузка данных для конкретной даты
   */
  const refreshDateData = useCallback(async (date) => {
    console.log(`🔄 Refreshing data for date: ${date}`);
    const today = new Date().toISOString().split('T')[0];
    
    if (date === today) {
      await loadTodayHabits(true);
      return {
        habits: todayHabits,
        stats: stats,
        phrase: phrase
      };
    } else {
      return await loadHabitsForDate(date, true);
    }
  }, [loadTodayHabits, loadHabitsForDate, todayHabits, stats, phrase]);

  /**
   * Инициализация при монтировании
   */
  useEffect(() => {
    const init = async () => {
      // Предзагружаем данные
      await habitServiceOptimized.prefetchData();
      
      // Загружаем привычки
      await Promise.all([
        loadTodayHabits(),
        loadAllHabits()
      ]);
    };
    
    init();
  }, []);

  /**
   * Автоматическое обновление каждые 2 минуты
   */
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastLoad = Date.now() - lastLoadTime.current;
      
      // Обновляем только если прошло >2 минут
      if (timeSinceLastLoad > 2 * 60 * 1000) {
        console.log('⏰ Auto-refresh triggered');
        loadTodayHabits();
      }
    }, 2 * 60 * 1000); // Каждые 2 минуты
    
    return () => clearInterval(interval);
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
    refreshDateData
  };
};