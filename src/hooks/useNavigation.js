import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';
import { useNavigationStack } from '../context/NavigationContext';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { pop } = useNavigationStack();
  const { isVisible = true } = options;
  const backButtonHandlerRef = useRef(null);
  const intervalRef = useRef(null);

  const goBack = useCallback(() => {
    console.log('Navigation: goBack called');
    if (onBack) onBack();
    else pop();
  }, [onBack, pop]);

  useEffect(() => {
    if (!tg || !tg.BackButton) {
      console.warn('Navigation: Telegram WebApp.BackButton not found');
      return;
    }

    const backButton = tg.BackButton;

    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };

    const showBackButton = () => {
      try {
        if (!backButton.isVisible && isVisible) {
          backButton.show();
        }
      } catch {}
    };

    showBackButton();
    backButtonHandlerRef.current = handleBack;
    backButton.onClick(handleBack);

    intervalRef.current = setInterval(() => {
      try {
        if (isVisible && tg?.BackButton && !tg.BackButton.isVisible) {
          tg.BackButton.show();
        }
      } catch {}
    }, 500);

    return () => {
      clearInterval(intervalRef.current);
      backButton.offClick?.(backButtonHandlerRef.current);
      tg.BackButton.hide();
    };
  }, [tg, goBack, isVisible]);

  return { goBack };
};
