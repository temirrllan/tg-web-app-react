import { useEffect, useRef, useCallback } from 'react';

/**
 * useNavigation — управляет Telegram BackButton.
 *
 * Стратегия: глобальный стек хэндлеров. Когда стек пуст — кнопка скрывается.
 * При быстрых переходах setTimeout(50ms) даёт React время на mount/unmount.
 */

// Глобальный стек — содержит id каждого активного useNavigation
const navStack = new Set();
let hideTimer = null;

function ensureBackButtonState() {
  // Отменяем предыдущий таймер
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  const backButton = window.Telegram?.WebApp?.BackButton;
  if (!backButton) return;

  if (navStack.size > 0) {
    backButton.show();
  } else {
    // Задержка чтобы дать следующей странице зарегистрироваться при быстрых переходах
    hideTimer = setTimeout(() => {
      if (navStack.size === 0) {
        backButton.hide();
      }
      hideTimer = null;
    }, 50);
  }
}

let idCounter = 0;

export const useNavigation = (onBack = null, options = {}) => {
  const { isVisible = true } = options;
  const onBackRef = useRef(onBack);
  const idRef = useRef(null);
  onBackRef.current = onBack;

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    if (!isVisible) {
      // Если этот экземпляр был в стеке — убираем
      if (idRef.current !== null) {
        navStack.delete(idRef.current);
        idRef.current = null;
        ensureBackButtonState();
      }
      return;
    }

    // Регистрируем в стеке
    const id = ++idCounter;
    idRef.current = id;
    navStack.add(id);

    const handleBack = () => {
      if (onBackRef.current) onBackRef.current();
      else window.history.back();
    };

    backButton.onClick(handleBack);
    ensureBackButtonState();

    return () => {
      navStack.delete(id);
      idRef.current = null;
      backButton.offClick?.(handleBack);
      ensureBackButtonState();
    };
  }, [isVisible]);

  // Cleanup при unmount если isVisible менялся
  useEffect(() => {
    return () => {
      if (idRef.current !== null) {
        navStack.delete(idRef.current);
        idRef.current = null;
        ensureBackButtonState();
      }
    };
  }, []);

  const goBack = useCallback(() => {
    if (onBackRef.current) onBackRef.current();
    else window.history.back();
  }, []);

  return { goBack };
};
