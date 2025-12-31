import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

/**
 * useNavigation — управляет Telegram BackButton.
 * ВАЖНО: НЕ меняет текст кнопки, если isVisible = false
 */
export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const backButtonHandlerRef = useRef(null);
  const intervalRef = useRef(null);
  const isActiveRef = useRef(true);

  const goBack = useCallback(() => {
    console.log('Navigation: goBack called');
    if (onBack) onBack();
    else window.history.back();
  }, [onBack]);

  useEffect(() => {
    if (!tg || !tg.BackButton) {
      console.warn('Navigation: Telegram WebApp.BackButton not found');
      return;
    }

    const backButton = tg.BackButton;
    isActiveRef.current = isVisible;

    // Если не видим - ничего не делаем
    if (!isVisible) {
      console.log('🔇 [useNavigation] isVisible=false, hiding BackButton');
      try {
        backButton.hide();
      } catch (e) {
        console.warn('Hide failed:', e);
      }
      return;
    }

    console.log('🔊 [useNavigation] isVisible=true, setting up BackButton');

    // Основной обработчик
    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };

    // Показываем кнопку (БЕЗ изменения текста)
    const showBackButton = () => {
      try {
        if (!backButton.isVisible && isActiveRef.current) {
          backButton.show();
        }
      } catch (err) {
        console.warn('Navigation: BackButton.show() failed', err);
      }
    };

    // Инициализация
    showBackButton();
    backButtonHandlerRef.current = handleBack;
    backButton.onClick(handleBack);

    // 🔄 Слежение: Telegram иногда скрывает кнопку — возвращаем обратно
    // НО: только если isActiveRef.current = true
    intervalRef.current = setInterval(() => {
      try {
        if (isActiveRef.current && tg?.BackButton && !tg.BackButton.isVisible) {
          tg.BackButton.show();
        }
      } catch {}
    }, 500);

    // Слушаем Telegram-события
    const restoreEvents = ['themeChanged', 'viewportChanged', 'reinit'];
    restoreEvents.forEach((event) => {
      if (tg.onEvent) {
        tg.onEvent(event, showBackButton);
      }
    });

    // Очистка
    return () => {
      console.log('🧹 [useNavigation] Cleaning up');
      isActiveRef.current = false;
      
      try {
        backButton.offClick?.(backButtonHandlerRef.current);
      } catch {}
      
      restoreEvents.forEach((event) => {
        if (tg.offEvent) {
          tg.offEvent(event, showBackButton);
        }
      });
      
      clearInterval(intervalRef.current);
      
      if (tg?.BackButton) {
        tg.BackButton.hide();
      }
    };
  }, [tg, goBack, isVisible]);

  return { goBack };
};