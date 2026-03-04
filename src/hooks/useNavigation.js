import { useEffect, useRef, useCallback } from 'react';
import { useTelegram } from './useTelegram';

/**
 * useNavigation — управляет Telegram BackButton.
 * Показывает "Назад" при монтировании, скрывает при размонтировании.
 */
export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  // Храним onBack в ref, чтобы не пересоздавать эффект при каждом рендере
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    if (!tg?.BackButton) return;

    const backButton = tg.BackButton;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg, isVisible]);

  const goBack = useCallback(() => {
    if (onBackRef.current) onBackRef.current();
    else window.history.back();
  }, []);

  return { goBack };
};
