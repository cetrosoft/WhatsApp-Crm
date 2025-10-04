/**
 * Language Context
 * Provides language switching functionality and manages RTL/LTR direction
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set document direction and language attribute
    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;

    // Store in localStorage
    localStorage.setItem('language', i18n.language);
  }, [i18n.language]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const isRTL = i18n.language === 'ar';
  const isArabic = i18n.language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        changeLanguage,
        currentLanguage: i18n.language,
        isRTL,
        isArabic
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export default LanguageContext;
