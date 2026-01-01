import { useEffect, useCallback, useRef } from 'react';
import { useTelegram } from './useTelegram';

/**
 * useNavigation — управляет Telegram BackButton БЕЗ МИГАНИЯ
 * 
 * ИСПРАВЛЕНИЯ:
 * 1. Удален интервал который постоянно вызывает show()
 * 2. Кнопка показывается ОДИН РАЗ при монтировании
 * 3. Используется флаг для предотвращения повторных вызовов
 */
export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  const backButtonHandlerRef = useRef(null);
  const isInitializedRef = useRef(false); // ✅ Флаг инициализации
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

    // Если не видим - скрываем и выходим
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

    // ✅ КРИТИЧНО: Показываем кнопку ТОЛЬКО ОДИН РАЗ
    const showBackButton = () => {
      try {
        // Проверяем что не инициализировано и активно
        if (!isInitializedRef.current && isActiveRef.current) {
          console.log('✅ [useNavigation] Showing BackButton (first time)');
          backButton.show();
          isInitializedRef.current = true; // Помечаем как инициализированное
        }
      } catch (err) {
        console.warn('Navigation: BackButton.show() failed', err);
      }
    };

    // Инициализация
    showBackButton();
    backButtonHandlerRef.current = handleBack;
    backButton.onClick(handleBack);

    // ❌ УДАЛЕНО: Интервал который вызывал мигание
    // intervalRef.current = setInterval(() => {
    //   try {
    //     if (isActiveRef.current && tg?.BackButton && !tg.BackButton.isVisible) {
    //       tg.BackButton.show(); // ← Это вызывало мигание!
    //     }
    //   } catch {}
    // }, 500);

    // ✅ ДОБАВЛЕНО: Одноразовая проверка через небольшую задержку
    // На случай если Telegram скрыл кнопку сразу после показа
    const checkTimeout = setTimeout(() => {
      try {
        if (isActiveRef.current && tg?.BackButton && !tg.BackButton.isVisible) {
          console.log('🔄 [useNavigation] Re-showing BackButton after initial check');
          tg.BackButton.show();
        }
      } catch (err) {
        console.warn('Re-show check failed:', err);
      }
    }, 300); // Один раз через 300ms

    // Слушаем Telegram-события для восстановления кнопки
    const restoreEvents = ['themeChanged', 'viewportChanged'];
    const handleRestore = () => {
      if (isActiveRef.current && !tg.BackButton.isVisible) {
        console.log('🔄 [useNavigation] Restoring BackButton after Telegram event');
        try {
          tg.BackButton.show();
        } catch (err) {
          console.warn('Restore failed:', err);
        }
      }
    };

    restoreEvents.forEach((event) => {
      if (tg.onEvent) {
        tg.onEvent(event, handleRestore);
      }
    });

    // Очистка
    return () => {
      console.log('🧹 [useNavigation] Cleaning up');
      isActiveRef.current = false;
      isInitializedRef.current = false; // Сбрасываем флаг
      
      clearTimeout(checkTimeout); // ✅ Очищаем таймаут
      
      try {
        backButton.offClick?.(backButtonHandlerRef.current);
      } catch {}
      
      restoreEvents.forEach((event) => {
        if (tg.offEvent) {
          tg.offEvent(event, handleRestore);
        }
      });
      
      // ❌ УДАЛЕНО: clearInterval(intervalRef.current);
      
      if (tg?.BackButton) {
        tg.BackButton.hide();
      }
    };
  }, [tg, goBack, isVisible]);

  return { goBack };
};