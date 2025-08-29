export const clearApplicationCache = () => {
  // Очищаем localStorage
  console.log('Clearing localStorage...');
  const keysToKeep = ['user_id', 'hasSeenSwipeHint']; // Сохраняем важные ключи
  const savedData = {};
  
  keysToKeep.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) savedData[key] = value;
  });
  
  localStorage.clear();
  
  // Восстанавливаем важные ключи
  Object.entries(savedData).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
  
  // Очищаем sessionStorage
  console.log('Clearing sessionStorage...');
  sessionStorage.clear();
  
  // Очищаем кэш Service Worker если есть
  if ('serviceWorker' in navigator) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`Cleared cache: ${name}`);
      });
    });
  }
  
  console.log('Cache cleared successfully');
};