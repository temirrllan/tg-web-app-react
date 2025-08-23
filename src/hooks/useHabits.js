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
 // Загрузка привычек на сегодня
const loadTodayHabits = useCallback(async () => {
  try {
    setLoading(true);
    const data = await habitService.getTodayHabits();

    const normalizedHabits = Array.isArray(data)
      ? data
      : (data?.habits || data?.items || data?.today || []);

    console.log('Raw habits from server:', normalizedHabits);

    // НЕ фильтруем здесь - сервер уже должен вернуть правильные привычки
    // Если сервер возвращает все привычки, то фильтруем на фронте
    const today = new Date();
    const currentDayOfWeek = today.getDay() || 7; // 0 (Sunday) = 7
    
    console.log('Today is:', {
      date: today.toISOString().split('T')[0],
      dayOfWeek: currentDayOfWeek,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][today.getDay()]
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

  // Загрузка привычек для конкретной даты
  // Загрузка привычек для конкретной даты
const loadHabitsForDate = useCallback(async (date) => {
  try {
    const targetDate = new Date(date + 'T12:00:00');
    const dayOfWeek = targetDate.getDay() || 7; // 0 (Sunday) = 7
    
    console.log('Loading habits for:', {
      date,
      dayOfWeek,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][targetDate.getDay()]
    });

    // Получаем все привычки пользователя
    const allHabitsData = await habitService.getAllHabits();
    const allHabits = allHabitsData?.habits || [];
    
    console.log('All user habits:', allHabits.map(h => ({
      title: h.title,
      schedule_days: h.schedule_days
    })));
    
    // Фильтруем привычки для выбранного дня
    const filteredHabits = allHabits.filter(habit => {
      if (!habit.schedule_days || habit.schedule_days.length === 0) {
        // Если нет расписания, показываем каждый день
        return true;
      }
      
      // Проверяем, входит ли день в расписание
      const included = habit.schedule_days.includes(dayOfWeek);
      console.log(`Habit "${habit.title}" - days: ${habit.schedule_days}, dayOfWeek: ${dayOfWeek}, included: ${included}`);
      return included;
    });
    
    console.log(`Filtered ${filteredHabits.length} habits for day ${dayOfWeek}`);
    
    // Для прошлых дней сбрасываем статусы
    const habitsWithStatus = filteredHabits.map(h => ({
      ...h,
      today_status: 'pending'
    }));
    
    return {
      habits: habitsWithStatus,
      stats: { completed: 0, total: habitsWithStatus.length }
    };
  } catch (err) {
    console.error('loadHabitsForDate error:', err);
    throw err;
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
      console.log('Creating habit with data:', habitData);
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