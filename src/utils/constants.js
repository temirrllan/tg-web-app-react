export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const HABIT_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

export const DAYS_OF_WEEK = [
  { id: 1, short: 'Mon', full: 'Monday', ru: 'Пн' },
  { id: 2, short: 'Tue', full: 'Tuesday', ru: 'Вт' },
  { id: 3, short: 'Wed', full: 'Wednesday', ru: 'Ср' },
  { id: 4, short: 'Thu', full: 'Thursday', ru: 'Чт' },
  { id: 5, short: 'Fri', full: 'Friday', ru: 'Пт' },
  { id: 6, short: 'Sat', full: 'Saturday', ru: 'Сб' },
  { id: 7, short: 'Sun', full: 'Sunday', ru: 'Вс' }
];

export const MOTIVATIONAL_IMAGES = {
  bear: '/images/bear.svg',
  welcome: '/images/welcome.svg'
};