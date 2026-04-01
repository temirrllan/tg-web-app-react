import { useEffect, useRef, useCallback } from 'react';

/**
 * useNavigation — управляет Telegram BackButton.
 * Пока компонент активен (isVisible=true) — показывает кнопку «Назад».
 * При размонтировании — надёжно скрывает кнопку, даже при быстрых переходах.
 */

// Глобальный счётчик активных навигаций — если 0, кнопку надо скрыть
let activeNavigationCount = 0;

export const useNavigation = (onBack = null, options = {}) => {
  const { isVisible = true } = options;
  const onBackRef = useRef(onBack);
  const registeredRef = useRef(false);
  const handleBackRef = useRef(null);
  onBackRef.current = onBack;

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    if (!isVisible) {
      return;
    }

    const handleBack = () => {
      if (onBackRef.current) onBackRef.current();
      else window.history.back();
    };

    handleBackRef.current = handleBack;
    registeredRef.current = true;
    activeNavigationCount++;

    backButton.show();
    backButton.onClick(handleBack);

    return () => {
      registeredRef.current = false;
      activeNavigationCount--;

      backButton.offClick?.(handleBack);

      // Скрываем кнопку только если нет других активных навигаций
      // Используем микротаск чтобы дать следующей странице зарегистрироваться
      Promise.resolve().then(() => {
        if (activeNavigationCount <= 0) {
          activeNavigationCount = 0;
          // Вызываем hide напрямую на прототипе, минуя любые перехваты
          const btn = window.Telegram?.WebApp?.BackButton;
          if (btn) {
            // Принудительно скрываем — обходим возможные no-op перехваты
            try {
              Object.getPrototypeOf(btn)?.hide?.call(btn);
            } catch {
              btn.hide();
            }
          }
        }
      });
    };
  }, [isVisible]);

  const goBack = useCallback(() => {
    if (onBackRef.current) onBackRef.current();
    else window.history.back();
  }, []);

  return { goBack };
};
