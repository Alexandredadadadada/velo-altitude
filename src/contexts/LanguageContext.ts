// Placeholder TypeScript context for LanguageContext
import { createContext } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {}
});

export default LanguageContext;
