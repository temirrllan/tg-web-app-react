import React, { useEffect, useState } from 'react';
import './SwipeHint.css';
import { useTranslation } from "../hooks/useTranslation";

const SwipeHint = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const { t } = useTranslation(); // Добавьте эту строку

  useEffect(() => {
    if (!show) return;
    
    // Показываем подсказку
    setIsVisible(true);
    setIsHiding(false);

    // Автоматически скрываем через 4 секунды
    const hideTimer = setTimeout(() => {
      setIsHiding(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, 4000);

    return () => clearTimeout(hideTimer);
  }, [show, onClose]);

  const handleOverlayClick = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!show || !isVisible) return null;

  return (
    <div 
      className={`swipe-hint-overlay ${isHiding ? 'swipe-hint-overlay--hiding' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="swipe-hint" onClick={(e) => e.stopPropagation()}>
        <h3 className="swipe-hint__title">{t("swipeHint.quickActions")}</h3>
        
        <div className="swipe-hint__content">
          <div className="swipe-hint__item">
            <div className="swipe-hint__arrow swipe-hint__arrow--left">
              ←
            </div>
            <div className="swipe-hint__text">
  <Trans i18nKey="swipe.left">
    <strong>Swipe left</strong> to mark habit as completed
  </Trans>
</div>
          </div>
          
          <div className="swipe-hint__item">
            <div className="swipe-hint__arrow swipe-hint__arrow--right">
              →
            </div>
            <Trans i18nKey="swipe.right">
    <strong>Swipe right</strong> to undo or mark as failed
  </Trans>
          </div>
        </div>
        
        <div className="swipe-hint__progress">
          <div className="swipe-hint__dot swipe-hint__dot--active"></div>
          <div className="swipe-hint__dot"></div>
          <div className="swipe-hint__dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SwipeHint;