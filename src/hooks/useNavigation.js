import { useEffect, useRef, useCallback } from 'react';

/**
 * useNavigation — управляет Telegram BackButton.
 * Использует window.Telegram.WebApp напрямую (синхронно),
 * без зависимости от асинхронного useTelegram() чтобы избежать мигания.
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
      backButton.show();
      backButton.onClick(handleBack);
    } else {
      backButton.hide();
    }

    return () => {
      backButton.offClick?.(handleBack);
      backButton.hide();
    };
  }, [isVisible]);

  const goBack = useCallback(() => {
    if (onBackRef.current) onBackRef.current();
    else window.history.back();
  }, []);

  return { goBack };
};
