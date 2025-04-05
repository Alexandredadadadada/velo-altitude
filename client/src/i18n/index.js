import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import translationEN from './locales/en.json';
import translationFR from './locales/fr.json';
import translationDE from './locales/de.json';
import translationIT from './locales/it.json';
import translationES from './locales/es.json';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  fr: {
    translation: translationFR
  },
  de: {
    translation: translationDE
  },
  it: {
    translation: translationIT
  },
  es: {
    translation: translationES
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'fr', // default language
    fallbackLng: 'en',
    keySeparator: false, // we use simple keys
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
