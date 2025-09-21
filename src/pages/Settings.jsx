import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import LanguageSelector from './LanguageSelector';
import './Settings.css';

const Settings = ({ onClose }) => {
  useNavigation(onClose);
  
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [nightTheme, setNightTheme] = useState(false);
  const [inboxNotifications, setInboxNotifications] = useState(true);
  
  useEffect(() => {
    // Загружаем сохраненные настройки
    const savedLanguage = localStorage.getItem('appLanguage') || 'English';
    const savedTheme = localStorage.getItem('nightTheme') === 'true';
    const savedNotifications = localStorage.getItem('inboxNotifications') !== 'false';
    
    setCurrentLanguage(savedLanguage);
    setNightTheme(savedTheme);
    setInboxNotifications(savedNotifications);
  }, []);
  
  const handleLanguageChange = (language) => {
    setCurrentLanguage(language);
    localStorage.setItem('appLanguage', language);
    setShowLanguageSelector(false);
  };
  
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
  
  if (showLanguageSelector) {
    return (
      <LanguageSelector 
        currentLanguage={currentLanguage}
        onSelect={handleLanguageChange}
        onClose={() => setShowLanguageSelector(false)}
      />
    );
  }
  
  return (
    <div className="settings">
      {/* <div className="settings__header">
        <button className="settings__back" onClick={onClose}>
          Back
        </button>
        <div className="settings__title-wrapper">
          <h2 className="settings__title">Habit Tracker</h2>
          <span className="settings__subtitle">mini-app</span>
        </div>
        <button className="settings__menu">
          ⋯
        </button>
      </div> */}
      
      <div className="settings__content">
        <div className="settings__section">
          <h3 className="settings__section-title">Application Settings</h3>
          
          <div className="settings__items">
            <button 
              className="settings__item"
              onClick={() => setShowLanguageSelector(true)}
            >
              <span className="settings__item-label">Language</span>
              <div className="settings__item-right">
                <span className="settings__item-value">{currentLanguage}</span>
                <span className="settings__item-arrow">›</span>
              </div>
            </button>
            
            <button className="settings__item">
              <span className="settings__item-label">Time Zone</span>
              <div className="settings__item-right">
                <span className="settings__item-value">System</span>
                <span className="settings__item-arrow">›</span>
              </div>
            </button>
            
            <button className="settings__item">
              <span className="settings__item-label">Display Settings</span>
              <span className="settings__item-arrow">›</span>
            </button>
          </div>
        </div>
        
        <div className="settings__theme-section">
          <div className="settings__theme-item">
            <span className="settings__theme-label">Night Theme</span>
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
          <h3 className="settings__section-title">Inbox Settings</h3>
          
          <div className="settings__items">
            <button className="settings__item">
              <div className="settings__item-content">
                <span className="settings__item-label">Inbox Notifications</span>
                <span className="settings__item-description">
                  Choose which types of inbox events the bot should send notifications about
                </span>
              </div>
              <div className="settings__item-right">
                <span className="settings__item-value">On</span>
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