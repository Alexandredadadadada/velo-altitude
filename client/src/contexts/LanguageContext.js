// Minimal LanguageContext for build unblock
import React from 'react';

export const LanguageContext = React.createContext({
  language: 'fr',
  setLanguage: () => {},
});

export default LanguageContext;
