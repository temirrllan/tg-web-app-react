import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './MaintenanceScreen.css';

const MaintenanceScreen = () => {
  const { t } = useTranslation();

  return (
    <div className="maintenance-screen">
      <div className="maintenance-screen__icon">
        <span className="maintenance-screen__gear maintenance-screen__gear--1">⚙️</span>
        <span className="maintenance-screen__gear maintenance-screen__gear--2">🔧</span>
      </div>
      <h1 className="maintenance-screen__title">{t('maintenance.title')}</h1>
      <p className="maintenance-screen__text">{t('maintenance.text')}</p>
      <p className="maintenance-screen__hint">{t('maintenance.hint')}</p>
      <div className="maintenance-screen__dots">
        <span className="maintenance-screen__dot" />
        <span className="maintenance-screen__dot" />
        <span className="maintenance-screen__dot" />
      </div>
    </div>
  );
};

export default MaintenanceScreen;
