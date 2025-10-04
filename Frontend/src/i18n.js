/**
 * i18n Configuration
 * Internationalization setup for Arabic RTL and English LTR
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // Load translation files
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to React
  .init({
    fallbackLng: 'ar', // Default to Arabic
    supportedLngs: ['ar', 'en'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    ns: [
      'common',
      'auth',
      'navigation',
      'settings',
      'dashboard',
      'inbox',
      'crm',
      'tickets',
      'campaigns',
      'billing'
    ],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for now
    },

    debug: false, // Set to true for debugging
  });

export default i18n;
