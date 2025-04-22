// Placeholder context to unblock build
import { createContext, useContext } from 'react';

const LanguageContext = createContext({
  language: 'fr',
  translations: {},
  setLanguage: () => {},
});

// Custom hook to access the language context
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext;
