import { useEffect, useRef, useCallback } from 'react';

/**
 * useNavigation — управляет Telegram BackButton.
 * Пока компонент активен (isVisible=true) — перехватывает backButton.hide(),
 * чтобы никакой внешний код (темы, аналитика, интервалы) не мог скрыть кнопку.
 */
export const useNavigation = (onBack = null, options = {}) => {
  const { isVisible = true } = options;
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const backButton = window.Telegram?.WebApp?.BackButton;
    if (!backButton) return;

    const handleBack = () => {
      if (onBackRef.current) onBackRef.current();
      else window.history.back();
    };

    if (isVisible) {
      // Сохраняем оригинальный hide и заменяем на no-op,
      // чтобы никакой внешний код не мог скрыть кнопку пока страница активна
      const originalHide = backButton.hide;
      backButton.hide = () => {};

      backButton.show();
      backButton.onClick(handleBack);

      return () => {
        // Восстанавливаем hide и скрываем кнопку при размонтировании
        backButton.hide = originalHide;
        backButton.offClick?.(handleBack);
        backButton.hide();
      };
    } else {
      backButton.hide();
    }
  }, [isVisible]);

  const goBack = useCallback(() => {
    if (onBackRef.current) onBackRef.current();
    else window.history.back();
  }, []);

  return { goBack };
};
