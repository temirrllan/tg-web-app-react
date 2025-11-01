import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const isInitializedRef = useRef(false);
  const backButtonHandlerRef = useRef(null);
  
   const goBack = useCallback(() => {
    console.log('Navigation: goBack called');
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);
  
  useEffect(() => {
    if (!tg || !tg.BackButton) {
      console.log('Navigation: Telegram WebApp or BackButton not available');
      return;
    }

    if (!isVisible) {
      tg.BackButton.hide();
      return;
    }

    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };

    handlerRef.current = handleBack;

    try {
      console.log('Navigation: Showing BackButton immediately');
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } catch (err) {
      console.warn('Navigation: Failed to show BackButton', err);
    }

    return () => {
      console.log('Navigation: Cleaning up BackButton');
      if (handlerRef.current) {
        tg.BackButton.offClick(handlerRef.current);
        handlerRef.current = null;
      }
      tg.BackButton.hide();
    };
  }, [tg, isVisible, goBack]);
  
  return { goBack };
};