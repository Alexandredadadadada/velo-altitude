import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import des ressources linguistiques
import translationFR from './i18n/fr/translation.json';
import translationEN from './i18n/en/translation.json';
import translationDE from './i18n/de/translation.json';
import translationIT from './i18n/it/translation.json';
import translationES from './i18n/es/translation.json';

// Les ressources linguistiques
const resources = {
  fr: {
    translation: translationFR
  },
  en: {
    translation: translationEN
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

// Détection de la langue du navigateur
const detectedLanguage = navigator.language.split('-')[0];
const supportedLanguages = ['fr', 'en', 'de', 'it', 'es'];
const defaultLanguage = supportedLanguages.includes(detectedLanguage) ? detectedLanguage : 'fr';

i18n
  .use(initReactI18next) // Intégration avec React
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'fr', // Langue par défaut si la traduction est manquante
    
    interpolation: {
      escapeValue: false, // Pas d'échappement nécessaire avec React
    },
    
    // Options supplémentaires
    debug: process.env.NODE_ENV === 'development',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: true, // Utilise Suspense pour les chargements de traduction
    },
    
    // Gestion des pluriels
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Format de date
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;
