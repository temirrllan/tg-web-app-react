// src/services/smartCache.js
class SmartCache {
  constructor() {
    this.memoryCache = new Map();
    this.pendingRequests = new Map();
    this.cacheVersion = '2.0.0';
    
    // Стратегии TTL для разных типов данных
    this.ttlStrategies = {
      categories: 30 * 60 * 1000,      // 30 минут (статика)
      user: 5 * 60 * 1000,              // 5 минут
      todayHabits: 30 * 1000,           // 30 секунд (часто меняется)
      dateHabits: 2 * 60 * 1000,        // 2 минуты
      habitStats: 60 * 1000,            // 1 минута
      habitMembers: 60 * 1000,          // 1 минута
      subscription: 2 * 60 * 1000       // 2 минуты
    };
  }

  /**
   * Stale-While-Revalidate паттерн
   * Возвращает кэш сразу, но проверяет актуальность в фоне
   */
  async get(key, fetcher, options = {}) {
    const { 
      ttl = 60000, 
      forceRefresh = false,
      staleWhileRevalidate = true 
    } = options;

    // Проверяем memory cache
    const cached = this.memoryCache.get(key);
    
    if (!forceRefresh && cached && this.isValid(cached, ttl)) {
      console.log(`✅ Cache HIT (fresh): ${key}`);
      
      // Если данные начинают устаревать (>50% TTL), обновляем в фоне
      if (staleWhileRevalidate && this.shouldRevalidate(cached, ttl)) {
        console.log(`🔄 Background revalidation: ${key}`);
        this.revalidateInBackground(key, fetcher, ttl);
      }
      
      return cached.data;
    }

    // Если есть устаревший кэш, возвращаем его + обновляем в фоне
    if (!forceRefresh && cached && staleWhileRevalidate) {
      console.log(`⚠️ Cache STALE (serving old data): ${key}`);
      this.revalidateInBackground(key, fetcher, ttl);
      return cached.data;
    }

    // Предотвращаем дублирование запросов
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ Request already pending: ${key}`);
      return await this.pendingRequests.get(key);
    }

    // Делаем новый запрос
    console.log(`❌ Cache MISS: ${key}`);
    const promise = this.fetchAndCache(key, fetcher, ttl);
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Проверка валидности кэша
   */
  isValid(cached, ttl) {
    if (!cached || !cached.timestamp) return false;
    const age = Date.now() - cached.timestamp;
    return age < ttl;
  }

  /**
   * Нужно ли обновлять в фоне
   */
  shouldRevalidate(cached, ttl) {
    const age = Date.now() - cached.timestamp;
    return age > (ttl * 0.5); // Обновляем если прошло >50% TTL
  }

  /**
   * Фоновое обновление
   */
  async revalidateInBackground(key, fetcher, ttl) {
    if (this.pendingRequests.has(key)) return;
    
    const promise = this.fetchAndCache(key, fetcher, ttl).catch(error => {
      console.error(`Background revalidation failed for ${key}:`, error);
    });
    
    this.pendingRequests.set(key, promise);
    
    try {
      await promise;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Загрузка и кэширование
   */
  async fetchAndCache(key, fetcher, ttl) {
    try {
      const data = await fetcher();
      
      const cached = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.cacheVersion
      };
      
      this.memoryCache.set(key, cached);
      this.saveToLocalStorage(key, cached);
      
      console.log(`💾 Cache SAVED: ${key}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
      throw error;
    }
  }

  /**
   * Сохранение в localStorage (опционально)
   */
  saveToLocalStorage(key, cached) {
    try {
      localStorage.setItem(key, JSON.stringify(cached));
    } catch (error) {
      console.warn('localStorage save failed:', error);
    }
  }

  /**
   * Инвалидация кэша
   */
  invalidate(pattern) {
    console.log(`🔄 Invalidating cache: ${pattern}`);
    
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
        try {
          localStorage.removeItem(key);
        } catch (e) {}
      }
    }
  }

  /**
   * Предзагрузка данных
   */
  async prefetch(key, fetcher, ttl) {
    const cached = this.memoryCache.get(key);
    if (cached && this.isValid(cached, ttl)) {
      return; // Уже есть свежие данные
    }
    
    console.log(`🚀 Prefetching: ${key}`);
    await this.fetchAndCache(key, fetcher, ttl);
  }

  /**
   * Очистка кэша
   */
  clear() {
    this.memoryCache.clear();
    this.pendingRequests.clear();
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {}
  }

  /**
   * Статистика
   */
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.memoryCache.keys())
    };
  }
}

export default new SmartCache();