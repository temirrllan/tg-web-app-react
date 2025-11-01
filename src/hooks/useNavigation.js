import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';
import { useNavigationStack } from '../context/NavigationContext.jsx';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();

  // 🔒 Безопасное обращение к контексту
  let navigation;
  try {
    navigation = useNavigationStack();
  } catch {
    navigation = null;
  }

  const pop = navigation?.pop || (() => window.history.back());
  const { isVisible = true } = options;
  const backButtonHandlerRef = useRef(null);
  const intervalRef = useRef(null);

  const goBack = useCallback(() => {
    console.log('Navigation: goBack called');
    if (onBack) onBack();
    else pop();
  }, [onBack, pop]);

  useEffect(() => {
    if (!tg?.BackButton) {
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
        if (isVisible) backButton.show();
      } catch (err) {
        console.warn('Failed to show BackButton:', err);
      }
    };

    showBackButton();
    backButtonHandlerRef.current = handleBack;
    backButton.onClick(handleBack);

    // 🔁 Проверяем стабильность кнопки раз в 0.5 сек
    intervalRef.current = setInterval(() => {
      try {
        if (isVisible && tg?.BackButton && !tg.BackButton.isVisible) {
          tg.BackButton.show();
        }
      } catch {}
    }, 500);

    return () => {
      clearInterval(intervalRef.current);
      try {
        backButton.offClick?.(backButtonHandlerRef.current);
        tg.BackButton.hide();
      } catch {}
    };
  }, [tg, goBack, isVisible]);

  return { goBack };
};
