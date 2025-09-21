import React from 'react';
import { useNavigation } from '../hooks/useNavigation';
import './LanguageSelector.css';

const LanguageSelector = ({ currentLanguage, onSelect, onClose }) => {
  useNavigation(onClose);
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Russian' },
    { code: 'kk', name: 'Kazakh' }
  ];
  
  return (
    <div className="language-selector">
      {/* <div className="language-selector__header">
        <button className="language-selector__close" onClick={onClose}>
          Close
        </button>
        <div className="language-selector__title-wrapper">
          <h2 className="language-selector__title">Habit Tracker</h2>
          <span className="language-selector__subtitle">mini-app</span>
        </div>
        <button className="language-selector__menu">
          ⋯
        </button>
      </div> */}
      
      <div className="language-selector__content">
        <h3 className="language-selector__heading">Language</h3>
        
        <div className="language-selector__list">
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`language-selector__item ${
                currentLanguage === lang.name ? 'language-selector__item--selected' : ''
              }`}
              onClick={() => onSelect(lang.name)}
            >
              <span className="language-selector__item-name">{lang.name}</span>
              {currentLanguage === lang.name && (
                <span className="language-selector__item-check">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;