import { useEffect, useCallback } from 'react';
import { useTelegram } from './useTelegram';

export const useNavigation = (onBack = null) => {
  const { tg } = useTelegram();
  
  const goBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);
  
  useEffect(() => {
    if (!tg) return;
    
    // Показываем кнопку Back
    tg.BackButton.show();
    
    // Обработчик клика на кнопку Back
    const handleBack = () => {
      goBack();
    };
    
    tg.BackButton.onClick(handleBack);
    
    // Cleanup
    return () => {
      tg.BackButton.hide();
      tg.BackButton.offClick(handleBack);
    };
  }, [tg, goBack]);
  
  return { goBack };
};