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
    
    // Предотвращаем повторную инициализацию
    if (isInitializedRef.current && backButtonHandlerRef.current) {
      console.log('Navigation: Already initialized, skipping');
      return;
    }
    
    if (!isVisible) {
      tg.BackButton.hide();
      return;
    }
    
    // Создаем обработчик один раз
    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };
    
    // Сохраняем ссылку на обработчик
    backButtonHandlerRef.current = handleBack;
    
    // Небольшая задержка для стабилизации
    const timeoutId = setTimeout(() => {
      console.log('Navigation: Showing BackButton');
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
      isInitializedRef.current = true;
    }, 100);
    
    // Cleanup при размонтировании компонента
    return () => {
      clearTimeout(timeoutId);
      console.log('Navigation: Cleaning up BackButton');
      
      if (backButtonHandlerRef.current) {
        tg.BackButton.offClick(backButtonHandlerRef.current);
        backButtonHandlerRef.current = null;
      }
      
      tg.BackButton.hide();
      isInitializedRef.current = false;
    };
  }, [tg, isVisible]); // Убираем goBack из зависимостей
  
  // Обновляем обработчик при изменении onBack
  useEffect(() => {
    if (backButtonHandlerRef.current && tg && tg.BackButton) {
      tg.BackButton.offClick(backButtonHandlerRef.current);
      
      const newHandler = () => {
        console.log('Navigation: BackButton clicked (updated)');
        goBack();
      };
      
      backButtonHandlerRef.current = newHandler;
      tg.BackButton.onClick(newHandler);
    }
  }, [goBack, tg]);
  
  return { goBack };
};