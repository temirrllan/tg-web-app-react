export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`; // было без бэктиков → синтаксическая ошибка
};


export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

export const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const isToday = (date) => date === getTodayDate();
export const isYesterday = (date) => date === getYesterdayDate();
export const canMarkDate = (date) => isToday(date) || isYesterday(date);

export const vibrate = (pattern = 10) => {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  } else if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};
