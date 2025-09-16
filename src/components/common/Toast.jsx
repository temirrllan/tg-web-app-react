import React, { useEffect, useState } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Добавляем вибрацию для тактильной обратной связи
    if (window.Telegram?.WebApp?.HapticFeedback) {
      switch(type) {
        case 'success':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          break;
        case 'error':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          break;
        case 'warning':
        case 'info':
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
          break;
        default:
          break;
      }
    }

    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose && onClose();
      }, 300); // Время анимации исчезновения
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose, type]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch(type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return '💬';
    }
  };

  return (
    <div className={`toast toast--${type} ${isLeaving ? 'toast--leaving' : ''}`}>
      <span className="toast__icon">{getIcon()}</span>
      <span className="toast__message">{message}</span>
    </div>
  );
};

export default Toast;