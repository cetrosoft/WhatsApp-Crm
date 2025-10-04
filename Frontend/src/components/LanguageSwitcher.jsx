/**
 * Language Switcher Component
 * Toggle between Arabic (RTL) and English (LTR)
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation('common');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label={t('language')}
      title={t('language')}
    >
      <Globe className="w-5 h-5" />
      <span className="text-sm font-medium">
        {i18n.language === 'ar' ? 'EN' : 'عربي'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
