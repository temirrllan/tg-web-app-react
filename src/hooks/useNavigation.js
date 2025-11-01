import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const handlerRef = useRef(null);
  const backButton = tg?.BackButton;

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
    if (!tg || !backButton) return;

    const safeShow = () => {
      try {
        if (isVisible) {
          backButton.show();
          console.log('Navigation: BackButton shown');
        } else {
          backButton.hide();
          console.log('Navigation: BackButton hidden');
        }
      } catch (err) {
        console.warn('Navigation: show/hide failed', err);
      }
    };

    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };

    handlerRef.current = handleBack;

    // Инициализация
    safeShow();
    backButton.onClick(handleBack);

    // ⚙️ Дополнительно: Telegram иногда сам скрывает кнопку
    // при themeChanged или viewportChanged — возвращаем её обратно
    const eventsToWatch = ['themeChanged', 'viewportChanged', 'reinit', 'settingsButtonClicked'];
    eventsToWatch.forEach((ev) => {
      tg.onEvent?.(ev, safeShow);
    });

    // Cleanup
    return () => {
      try {
        backButton.offClick?.(handlerRef.current);
      } catch (err) {
        console.warn('Navigation: offClick failed', err);
      }

      eventsToWatch.forEach((ev) => {
        try {
          tg.offEvent?.(ev, safeShow);
        } catch (err) {}
      });
    };
  }, [tg, backButton, isVisible, goBack]);

  return { goBack };
};
