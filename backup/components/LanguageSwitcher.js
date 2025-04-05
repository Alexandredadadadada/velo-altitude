import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

/**
 * Composant pour changer la langue de l'application
 * Optimisé pour une utilisation à l'échelle européenne
 */
const LanguageSwitcher = ({ position = 'dropdown', size = 'medium' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const menuRef = useRef(null);

  // Liste complète des langues disponibles
  const languages = [
    { code: 'fr', name: 'Français', flag: '/images/flags/fr.svg', nativeName: 'Français' },
    { code: 'en', name: 'English', flag: '/images/flags/gb.svg', nativeName: 'English' },
    { code: 'de', name: 'Deutsch', flag: '/images/flags/de.svg', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italiano', flag: '/images/flags/it.svg', nativeName: 'Italiano' },
    { code: 'es', name: 'Español', flag: '/images/flags/es.svg', nativeName: 'Español' }
  ];

  // Mettre à jour l'état local quand la langue change
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Obtenir la langue actuelle
  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === currentLang) || languages[0];
  };

  // Changer la langue
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);
    
    // Sauvegarder la préférence dans localStorage
    localStorage.setItem('preferred_language', langCode);
    
    // Mettre à jour l'attribut lang sur le document HTML
    document.documentElement.setAttribute('lang', langCode);
  };

  // Rendu en mode barre horizontale
  if (position === 'horizontal') {
    return (
      <div className={`language-bar language-size-${size}`} role="navigation" aria-label={t('navigation.languages')}>
        {languages.map(lang => (
          <button
            key={lang.code}
            className={`language-option ${lang.code === currentLang ? 'active' : ''}`}
            onClick={() => changeLanguage(lang.code)}
            aria-pressed={lang.code === currentLang}
            title={lang.name}
          >
            <img 
              src={lang.flag} 
              alt={`${lang.name} flag`} 
              className="language-flag"
              width="24"
              height="24"
            />
            {(size === 'large' || size === 'medium') && <span className="language-name">{lang.nativeName}</span>}
          </button>
        ))}
      </div>
    );
  }

  // Rendu en mode dropdown (par défaut)
  return (
    <div 
      className={`language-switcher language-size-${size}`} 
      ref={menuRef}
      aria-expanded={isOpen}
      role="region"
      aria-label={t('navigation.languages')}
    >
      <button 
        className="language-selected" 
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-controls="language-dropdown"
      >
        <img 
          src={getCurrentLanguage().flag} 
          alt={`${getCurrentLanguage().name} flag`} 
          className="language-flag"
          width="24"
          height="24"
        />
        {(size === 'large' || size === 'medium') && (
          <>
            <span className="language-name">{getCurrentLanguage().nativeName}</span>
            <span className="language-arrow">
              <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} aria-hidden="true"></i>
            </span>
          </>
        )}
      </button>

      {isOpen && (
        <div 
          className="language-dropdown" 
          id="language-dropdown"
          role="menu"
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === currentLang ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
              aria-pressed={lang.code === currentLang}
              role="menuitem"
            >
              <img 
                src={lang.flag} 
                alt={`${lang.name} flag`} 
                className="language-flag"
                width="24"
                height="24"
              />
              <span className="language-name">{lang.nativeName}</span>
              <span className="language-native-name">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
