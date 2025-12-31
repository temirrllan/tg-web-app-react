import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

/**
 * useNavigation — управляет Telegram BackButton.
 * НЕ меняет текст кнопки, если он уже установлен компонентом
 */
export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const backButtonHandlerRef = useRef(null);
  const intervalRef = useRef(null);

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

    // Основной обработчик
    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };

    // Показываем кнопку "Назад" (БЕЗ изменения текста)
    const showBackButton = () => {
      try {
        if (!backButton.isVisible && isVisible) {
          backButton.show();
          console.log('Navigation: BackButton forced visible');
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
    // ⚠️ НЕ меняем текст кнопки в интервале - только показываем
    intervalRef.current = setInterval(() => {
      try {
        if (isVisible && tg?.BackButton && !tg.BackButton.isVisible) {
          tg.BackButton.show();
          // Убрали логирование, чтобы не спамить консоль
        }
      } catch {}
    }, 500);

    // Слушаем Telegram-события, чтобы повторно показывать кнопку
    // Но НЕ меняем текст
    const restoreEvents = ['themeChanged', 'viewportChanged', 'reinit'];
    restoreEvents.forEach((event) => tg.onEvent?.(event, showBackButton));

    // Очистка
    return () => {
      try {
        backButton.offClick?.(backButtonHandlerRef.current);
      } catch {}
      restoreEvents.forEach((event) => tg.offEvent?.(event, showBackButton));
      clearInterval(intervalRef.current);
      if (tg?.BackButton) {
        tg.BackButton.hide();
        console.log('Navigation: BackButton hidden on cleanup');
      }
    };
  }, [tg, goBack, isVisible]);

  return { goBack };
};