import { useEffect, useCallback } from 'react';
import { useTelegram } from './useTelegram';

export const useNavigation = (onBack = null, options = {}) => {
  const { tg } = useTelegram();
  const { isVisible = true } = options;
  
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
    
    // Показываем кнопку Back
    console.log('Navigation: Showing BackButton');
    tg.BackButton.show();
    
    // Обработчик клика на кнопку Back
    const handleBack = () => {
      console.log('Navigation: BackButton clicked');
      goBack();
    };
    
    // Регистрируем обработчик
    tg.BackButton.onClick(handleBack);
    
    // Cleanup при размонтировании компонента
    return () => {
      console.log('Navigation: Cleaning up BackButton');
      tg.BackButton.hide();
      tg.BackButton.offClick(handleBack);
    };
  }, [tg, goBack, isVisible]);
  
  return { goBack };
};