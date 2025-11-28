import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const backButtonHandlerRef = useRef(null);
  const shownRef = useRef(false); // предотвращает повторные show()

  const goBack = useCallback(() => {
    if (onBack) onBack();
    else window.history.back();
  }, [onBack]);

  useEffect(() => {
    if (!tg?.BackButton) return;

    const backButton = tg.BackButton;

    const handleBack = () => {
      goBack();
    };

    // Показываем кнопку ОДИН раз
    const showBackButton = () => {
      if (!isVisible) return;

      try {
        if (!shownRef.current) {
          backButton.show();
          shownRef.current = true;
        }
      } catch (e) {
        console.warn('BackButton.show error', e);
      }
    };

    // Инициализация
    showBackButton();

    backButtonHandlerRef.current = handleBack;
    backButton.onClick(handleBack);

    // Telegram иногда сбрасывает кнопку → возвращаем ОДИН раз
    const restoreEvents = ['reinit', 'themeChanged', 'viewportChanged', 'settingsButtonPressed'];

    restoreEvents.forEach(event =>
      tg.onEvent?.(event, () => {
        shownRef.current = false; // Telegram сбросил кнопку → показываем заново
        showBackButton();
      })
    );

    // cleanup
    return () => {
      try {
        backButton.offClick?.(backButtonHandlerRef.current);
      } catch {}

      restoreEvents.forEach(event =>
        tg.offEvent?.(event, showBackButton)
      );

      try {
        backButton.hide();
      } catch {}

      shownRef.current = false;
    };
  }, [tg, goBack, isVisible]);

  return { goBack };
};
