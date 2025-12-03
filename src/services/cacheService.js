// src/services/cacheService.js - УЛУЧШЕННАЯ ВЕРСИЯ

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.cacheVersion = '2.0.0';
    this.defaultTTL = 5 * 60 * 1000; // 5 минут
    
    // 🆕 Префетчинг - загружаем данные в фоне
    this.prefetchQueue = new Set();
    this.isPrefetching = false;
    
    // 🆕 Оптимистичные обновления
    this.optimisticUpdates = new Map();
    
    console.log('💾 CacheService v2.0.0 initialized');
  }

  /**
   * 🚀 ГЛАВНЫЙ МЕТОД - Получить с мгновенным кэшем
   */
  async fetch(key, fetchFn, options = {}) {
    const { 
      ttl = this.defaultTTL, 
      forceRefresh = false,
      optimistic = false,
      staleWhileRevalidate = true // 🆕 Показываем старые данные пока грузим новые
    } = options;

    // 1️⃣ Проверяем оптимистичное обновление
    if (optimistic && this.optimisticUpdates.has(key)) {
      console.log('⚡ Optimistic data:', key);
      return this.optimisticUpdates.get(key);
    }

    // 2️⃣ Проверяем свежий кэш
    const cached = this.get(key);
    if (cached && !forceRefresh) {
      console.log('✅ Fresh cache HIT:', key);
      
      // 🆕 Фоновое обновление если кэш скоро истечёт
      if (staleWhileRevalidate && this.isExpiringSoon(key)) {
        this.backgroundRefresh(key, fetchFn, ttl);
      }
      
      return cached;
    }

    // 3️⃣ Проверяем устаревший кэш (stale-while-revalidate)
    const stale = this.getStale(key);
    if (stale && staleWhileRevalidate && !forceRefresh) {
      console.log('⏰ Stale cache HIT (revalidating):', key);
      
      // Возвращаем старые данные, но запускаем обновление в фоне
      this.backgroundRefresh(key, fetchFn, ttl);
      return stale;
    }

    // 4️⃣ Нет кэша - загружаем
    console.log('🌐 Fetching fresh data:', key);
    
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error('❌ Fetch error:', key, error);
      
      // Возвращаем устаревший кэш если есть
      if (stale) {
        console.log('📦 Returning stale data due to error');
        return stale;
      }
      
      throw error;
    }
  }

  /**
   * 🆕 Фоновое обновление кэша
   */
  async backgroundRefresh(key, fetchFn, ttl) {
    // Избегаем дублирования запросов
    if (this.prefetchQueue.has(key)) {
      return;
    }
    
    this.prefetchQueue.add(key);
    console.log('🔄 Background refresh started:', key);
    
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      console.log('✅ Background refresh complete:', key);
    } catch (error) {
      console.error('❌ Background refresh failed:', key, error);
    } finally {
      this.prefetchQueue.delete(key);
    }
  }

  /**
   * 🆕 Оптимистичное обновление (для мгновенного UI)
   */
  setOptimistic(key, data) {
    console.log('⚡ Optimistic update:', key);
    this.optimisticUpdates.set(key, data);
    
    // Автоматически удаляем через 5 секунд
    setTimeout(() => {
      this.optimisticUpdates.delete(key);
    }, 5000);
  }

  /**
   * 🆕 Проверка - скоро истечёт ли кэш
   */
  isExpiringSoon(key, threshold = 0.8) {
    const cached = this.getRaw(key);
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    const remainingLife = cached.ttl - age;
    const lifePercentage = remainingLife / cached.ttl;
    
    return lifePercentage < threshold; // Меньше 80% времени
  }

  /**
   * 🆕 Получить устаревшие данные
   */
  getStale(key) {
    const raw = this.getRaw(key);
    if (!raw) return null;
    
    console.log('📦 Stale cache found:', key);
    return raw.data;
  }

  /**
   * Получить RAW кэш (с метаданными)
   */
  getRaw(key) {
    // Memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // LocalStorage cache
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const cached = JSON.parse(stored);
        this.memoryCache.set(key, cached);
        return cached;
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }

    return null;
  }

  /**
   * Получить данные из кэша (только валидные)
   */
  get(key) {
    const cached = this.getRaw(key);
    
    if (!cached) {
      return null;
    }
    
    if (this.isValid(cached)) {
      console.log('✅ Valid cache:', key);
      return cached.data;
    } else {
      console.log('⏰ Expired cache:', key);
      return null;
    }
  }

  /**
   * Сохранить данные в кэш
   */
  set(key, data, ttl = this.defaultTTL) {
    const cached = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.cacheVersion
    };

    // Memory cache
    this.memoryCache.set(key, cached);

    // LocalStorage cache
    try {
      localStorage.setItem(key, JSON.stringify(cached));
      console.log('💾 Cache saved:', key, `(TTL: ${ttl}ms)`);
    } catch (error) {
      console.warn('⚠️ localStorage full:', error);
      this.cleanOldCache();
    }
  }

  /**
   * Проверить валидность кэша
   */
  isValid(cached) {
    if (!cached || !cached.timestamp || !cached.version) {
      return false;
    }

    if (cached.version !== this.cacheVersion) {
      return false;
    }

    const age = Date.now() - cached.timestamp;
    return age < cached.ttl;
  }

  /**
   * Удалить из кэша
   */
  remove(key) {
    this.memoryCache.delete(key);
    this.optimisticUpdates.delete(key);
    
    try {
      localStorage.removeItem(key);
      console.log('🗑️ Cache removed:', key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  /**
   * Инвалидировать кэш по паттерну
   */
  invalidate(pattern) {
    console.log('🔄 Invalidating cache:', pattern);
    
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Optimistic updates
    for (const key of this.optimisticUpdates.keys()) {
      if (key.includes(pattern)) {
        this.optimisticUpdates.delete(key);
      }
    }

    // LocalStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Очистить весь кэш
   */
  clear() {
    console.log('🧹 Clearing all cache');
    this.memoryCache.clear();
    this.optimisticUpdates.clear();
    this.prefetchQueue.clear();
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Очистить старый кэш
   */
  cleanOldCache() {
    console.log('🧹 Cleaning old cache');
    
    // Memory cache
    for (const [key, cached] of this.memoryCache.entries()) {
      if (!this.isValid(cached)) {
        this.memoryCache.delete(key);
      }
    }

    // LocalStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          try {
            const cached = JSON.parse(localStorage.getItem(key));
            if (!this.isValid(cached)) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * 🆕 Префетчинг данных
   */
  async prefetch(keys, fetchFunctions, ttl = this.defaultTTL) {
    console.log('🚀 Prefetching data:', keys.length, 'keys');
    
    const promises = keys.map(async (key, index) => {
      const fetchFn = fetchFunctions[index];
      if (!fetchFn) return;
      
      try {
        const data = await fetchFn();
        this.set(key, data, ttl);
        console.log('✅ Prefetched:', key);
      } catch (error) {
        console.error('❌ Prefetch failed:', key, error);
      }
    });
    
    await Promise.all(promises);
  }

  /**
   * Статистика кэша
   */
  getStats() {
    const memorySize = this.memoryCache.size;
    const optimisticSize = this.optimisticUpdates.size;
    const prefetchQueueSize = this.prefetchQueue.size;
    
    let localStorageKeys = 0;
    try {
      localStorageKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('cache_')).length;
    } catch (e) {
      // ignore
    }
    
    return {
      memorySize,
      optimisticSize,
      prefetchQueueSize,
      localStorageKeys,
      totalCached: memorySize + localStorageKeys
    };
  }
}

export default new CacheService();