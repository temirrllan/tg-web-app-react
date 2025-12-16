// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTranslation } from '../hooks/useTranslation';
import { useTheme } from '../hooks/useTheme'; // 🆕 ДОБАВИЛИ
import LanguageSelector from './LanguageSelector';
import './Settings.css';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

const Settings = ({ onClose }) => {
  useNavigation(onClose);
  const { t, language } = useTranslation();
  const { isDark, toggleTheme } = useTheme(); // 🆕 ИСПОЛЬЗУЕМ ThemeContext
    useTelegramTheme();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [inboxNotifications, setInboxNotifications] = useState(true);
  
  useEffect(() => {
    const savedNotifications = localStorage.getItem('inboxNotifications') !== 'false';
    setInboxNotifications(savedNotifications);
  }, []);
  
  // 🔥 УДАЛИЛИ весь код с localStorage для темы - теперь через ThemeContext

  const handleInboxToggle = () => {
    const next = !inboxNotifications;
    setInboxNotifications(next);
    localStorage.setItem('inboxNotifications', String(next));
  };
  
  const getLanguageDisplayName = () => t(`languages.${language}`);
  
  if (showLanguageSelector) {
    return <LanguageSelector onClose={() => setShowLanguageSelector(false)} />;
  }
  
  return (
    <div className="settings">
      <div className="settings__content">
        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.applicationSettings')}</h3>
          
          <div className="settings__items">
            <button 
              className="settings__item"
              onClick={() => setShowLanguageSelector(true)}
            >
              <span className="settings__item-label">{t('settings.language')}</span>
              <div className="settings__item-right">
                <span className="settings__item-value">{getLanguageDisplayName()}</span>
                <span className="settings__item-arrow">›</span>
              </div>
            </button>
            
            <button className="settings__item" disabled>
              <span className="settings__item-label">{t('settings.timeZone')}</span>
              <div className="settings__item-right">
                <span className="settings__item-value">{t('settings.system')}</span>
                <span className="settings__item-arrow">›</span>
              </div>
            </button>
            
            <button className="settings__item" disabled>
              <span className="settings__item-label">{t('settings.displaySettings')}</span>
              <span className="settings__item-arrow">›</span>
            </button>
          </div>
        </div>
        
        {/* 🆕 Обновленный переключатель темы */}
        <div className="settings__theme-section">
          <div className="settings__theme-item">
            <span className="settings__theme-label">{t('settings.nightTheme')}</span>
            <button 
              className={`settings__toggle ${isDark ? 'settings__toggle--active' : ''}`}
              onClick={toggleTheme} // 🆕 Используем toggleTheme из контекста
              aria-pressed={isDark}
              aria-label={t('settings.nightTheme')}
            >
              <div className="settings__toggle-slider">
                <span className="settings__toggle-icon">
                  {isDark ? '🌙' : '☀️'}
                </span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.inboxSettings')}</h3>
          
          <div className="settings__items">
            <button className="settings__item" onClick={handleInboxToggle}>
              <div className="settings__item-content">
                <span className="settings__item-label">{t('settings.inboxNotifications')}</span>
                <span className="settings__item-description">
                  {t('settings.inboxNotificationsDescription')}
                </span>
              </div>
              <div className="settings__item-right">
                <span className="settings__item-value">
                  {inboxNotifications ? t('settings.on') : t('settings.off')}
                </span>
                <span className="settings__item-arrow">›</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;