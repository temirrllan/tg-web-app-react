import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';
import './Settings.css';

const Settings = ({ onClose }) => {
  useNavigation(onClose);
  const { t, language } = useTranslation();
  
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [nightTheme, setNightTheme] = useState(false);
  const [inboxNotifications, setInboxNotifications] = useState(true);
  
  useEffect(() => {
    // Загружаем сохраненные настройки
    const savedTheme = localStorage.getItem('nightTheme') === 'true';
    const savedNotifications = localStorage.getItem('inboxNotifications') !== 'false';
    
    setNightTheme(savedTheme);
    setInboxNotifications(savedNotifications);
  }, []);
  
  const handleThemeToggle = () => {
    const newTheme = !nightTheme;
    setNightTheme(newTheme);
    localStorage.setItem('nightTheme', String(newTheme));
    
    // Применяем тему к документу
    if (newTheme) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };
  
  const getLanguageDisplayName = () => {
    return t(`languages.${language}`);
  };
  
  if (showLanguageSelector) {
    return (
      <LanguageSelector 
        onClose={() => setShowLanguageSelector(false)}
      />
    );
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
            
            <button className="settings__item">
              <span className="settings__item-label">{t('settings.timeZone')}</span>
              <div className="settings__item-right">
                <span className="settings__item-value">{t('settings.system')}</span>
                <span className="settings__item-arrow">›</span>
              </div>
            </button>
            
            <button className="settings__item">
              <span className="settings__item-label">{t('settings.displaySettings')}</span>
              <span className="settings__item-arrow">›</span>
            </button>
          </div>
        </div>
        
        <div className="settings__theme-section">
          <div className="settings__theme-item">
            <span className="settings__theme-label">{t('settings.nightTheme')}</span>
            <button 
              className={`settings__toggle ${nightTheme ? 'settings__toggle--active' : ''}`}
              onClick={handleThemeToggle}
            >
              <div className="settings__toggle-slider">
                <span className="settings__toggle-icon">
                  {nightTheme ? '🌙' : '☀️'}
                </span>
              </div>
            </button>
          </div>
        </div>
        
        <div className="settings__section">
          <h3 className="settings__section-title">{t('settings.inboxSettings')}</h3>
          
          <div className="settings__items">
            <button className="settings__item">
              <div className="settings__item-content">
                <span className="settings__item-label">{t('settings.inboxNotifications')}</span>
                <span className="settings__item-description">
                  {t('settings.inboxNotificationsDescription')}
                </span>
              </div>
              <div className="settings__item-right">
                <span className="settings__item-value">{t('settings.on')}</span>
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