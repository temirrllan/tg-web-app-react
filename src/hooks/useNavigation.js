import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const handlerRef = useRef(null);

  const goBack = useCallback(() => {
    console.log('Navigation: goBack called');
    try {
      if (onBack) {
        onBack();
      } else {
        window.history.back();
      }
    } catch (err) {
      console.error('Navigation: goBack error', err);
    }
  }, [onBack]);

  useEffect(() => {
    if (!tg) {
      console.log('Navigation: Telegram WebApp not available');
      return;
    }

    // Защитно проверяем наличие BackButton API
    const back = tg.BackButton;
    if (!back || typeof back.show !== 'function' || typeof back.onClick !== 'function') {
      console.log('Navigation: BackButton API not available on tg object');
      return;
    }

    if (!isVisible) {
      try {
        back.hide();
      } catch (err) {
        console.warn('Navigation: BackButton.hide failed', err);
      }
      return;
    }

    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };

    handlerRef.current = handleBack;

    try {
      // Показать BackButton и повесить обработчик сразу
      console.log('Navigation: Showing BackButton');
      back.show();
      back.onClick(handleBack);
    } catch (err) {
      console.warn('Navigation: Failed to show/onClick BackButton', err);
    }

    return () => {
      console.log('Navigation: Cleaning up BackButton');
      try {
        if (handlerRef.current) {
          back.offClick?.(handlerRef.current);
          handlerRef.current = null;
        }
      } catch (err) {
        console.warn('Navigation: Failed to offClick BackButton', err);
      }
      try {
        back.hide();
      } catch (err) {
        console.warn('Navigation: Failed to hide BackButton during cleanup', err);
      }
    };
  // isVisible and goBack included
  }, [tg, isVisible, goBack]);

  return { goBack };
};
