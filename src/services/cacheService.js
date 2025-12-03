// src/services/cacheService.js - ПОЛНОСТЬЮ НОВАЯ ВЕРСИЯ

class CacheService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map(); // Для дедупликации запросов
    this.subscribers = new Map(); // Подписчики на изменения
    this.cacheVersion = '2.0.0';
  }

  /**
   * Получить данные с кэшированием и дедупликацией запросов
   */
  async fetch(key, fetchFn, options = {}) {
    const {
      ttl = 5 * 60 * 1000, // 5 минут по умолчанию
      forceRefresh = false,
      optimistic = false
    } = options;

    // 1. Проверяем кэш (если не принудительное обновление)
    if (!forceRefresh) {
      const cached = this.get(key);
      if (cached) {
        console.log('✅ Cache HIT:', key);
        
        // Фоновое обновление для свежести данных
        if (this.shouldRefreshInBackground(key)) {
          this.refreshInBackground(key, fetchFn, ttl);
        }
        
        return cached;
      }
    }

    // 2. Проверяем, не выполняется ли уже этот запрос
    if (this.pendingRequests.has(key)) {
      console.log('⏳ Waiting for pending request:', key);
      return this.pendingRequests.get(key);
    }

    // 3. Выполняем запрос
    console.log('🌐 Fetching from server:', key);
    const requestPromise = fetchFn()
      .then(data => {
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        this.notifySubscribers(key, data);
        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        
        // Возвращаем устаревший кэш при ошибке
        const staleCache = this.getStale(key);
        if (staleCache) {
          console.warn('⚠️ Using stale cache due to error:', key);
          return staleCache;
        }
        
        throw error;
      });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Сохранить в кэш
   */
  set(key, data, ttl = 5 * 60 * 1000) {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.cacheVersion
    };

    this.cache.set(key, entry);
    
    // Сохраняем в localStorage для персистентности
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
  }

  /**
   * Получить из кэша
   */
  get(key) {
    // Проверяем memory cache
    let entry = this.cache.get(key);
    
    // Если нет в памяти, проверяем localStorage
    if (!entry) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          // Восстанавливаем в memory cache
          this.cache.set(key, entry);
        }
      } catch (e) {
        console.warn('localStorage read failed:', e);
      }
    }

    if (!entry) return null;

    // Проверяем валидность
    if (this.isValid(entry)) {
      return entry.data;
    }

    // Кэш истёк
    this.cache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {}
    
    return null;
  }

  /**
   * Получить устаревший кэш (для fallback при ошибках)
   */
  getStale(key) {
    const entry = this.cache.get(key);
    if (entry && entry.data) {
      return entry.data;
    }

    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const entry = JSON.parse(stored);
        return entry.data;
      }
    } catch (e) {}

    return null;
  }

  /**
   * Проверка валидности кэша
   */
  isValid(entry) {
    if (!entry || !entry.timestamp || entry.version !== this.cacheVersion) {
      return false;
    }

    const age = Date.now() - entry.timestamp;
    return age < entry.ttl;
  }

  /**
   * Нужно ли обновить в фоне
   */
  shouldRefreshInBackground(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    const halfTtl = entry.ttl / 2;
    
    // Обновляем когда прошло больше половины TTL
    return age > halfTtl;
  }

  /**
   * Фоновое обновление
   */
  async refreshInBackground(key, fetchFn, ttl) {
    // Не запускаем если уже идет обновление
    if (this.pendingRequests.has(key)) {
      return;
    }

    console.log('🔄 Background refresh:', key);
    
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      this.notifySubscribers(key, data);
    } catch (error) {
      console.warn('Background refresh failed:', key, error);
    }
  }

  /**
   * Инвалидация кэша по паттерну
   */
  invalidate(pattern) {
    console.log('🗑️ Invalidating cache:', pattern);
    
    const keysToDelete = [];
    
    // Memory cache
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
        this.cache.delete(key);
      }
    }

    // localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}

    // Уведомляем подписчиков об инвалидации
    keysToDelete.forEach(key => {
      this.notifySubscribers(key, null);
    });
  }

  /**
   * Подписка на изменения
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Возвращаем функцию отписки
    return () => {
      const subs = this.subscribers.get(key);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Уведомление подписчиков
   */
  notifySubscribers(key, data) {
    const subs = this.subscribers.get(key);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error('Subscriber callback error:', e);
        }
      });
    }
  }

  /**
   * Очистить весь кэш
   */
  clear() {
    this.cache.clear();
    this.pendingRequests.clear();
    
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {}
  }

  /**
   * Получить статистику
   */
  getStats() {
    return {
      memorySize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      subscribers: this.subscribers.size
    };
  }
}

export default new CacheService();