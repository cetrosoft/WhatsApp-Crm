# Internationalization (i18n) Guide
## Arabic RTL & English LTR Support

Last Updated: 2025-10-02

---

## 🌍 Overview

The Omnichannel CRM SaaS Platform supports full bilingual functionality with:
- **Arabic (العربية)** - Right-to-Left (RTL) - Default/Primary
- **English** - Left-to-Right (LTR) - Secondary

---

## 🎯 Implementation Checklist

### Database Setup
- [x] Add `preferred_language` column to `users` table
- [x] Add `default_language` column to `organizations` table
- [ ] Run migration `001a_i18n_support.sql` in Supabase

### Frontend Setup
- [ ] Install i18n dependencies
- [ ] Configure i18next
- [ ] Configure Tailwind RTL plugin
- [ ] Create translation files structure
- [ ] Build LanguageProvider context
- [ ] Build language switcher component
- [ ] Update existing components for RTL

### Backend Setup
- [ ] Update user registration to include language preference
- [ ] Create multi-language email templates
- [ ] Update invitation service for bilingual emails

---

## 📦 Frontend Dependencies

### Install Required Packages

```bash
cd Frontend
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
npm install -D tailwindcss-rtl
```

**Packages:**
- `react-i18next` - React bindings for i18next
- `i18next` - Core internationalization framework
- `i18next-browser-languagedetector` - Auto-detect user language
- `i18next-http-backend` - Load translation files
- `tailwindcss-rtl` - RTL support for Tailwind CSS

---

## ⚙️ Configuration Files

### 1. i18n Configuration (`src/i18n.js`)

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
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

    ns: ['common', 'auth', 'dashboard', 'inbox', 'crm', 'tickets', 'campaigns', 'billing'],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### 2. Tailwind RTL Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

### 3. Main App Integration (`src/main.jsx`)

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n'; // Import i18n config

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

## 📁 Translation Files Structure

```
Frontend/
└── public/
    └── locales/
        ├── ar/
        │   ├── common.json
        │   ├── auth.json
        │   ├── dashboard.json
        │   ├── inbox.json
        │   ├── crm.json
        │   ├── tickets.json
        │   ├── campaigns.json
        │   └── billing.json
        └── en/
            ├── common.json
            ├── auth.json
            ├── dashboard.json
            ├── inbox.json
            ├── crm.json
            ├── tickets.json
            ├── campaigns.json
            └── billing.json
```

---

## 📝 Translation File Examples

### `public/locales/ar/common.json`

```json
{
  "appName": "منصة إدارة العملاء الشاملة",
  "welcome": "مرحباً",
  "loading": "جاري التحميل...",
  "save": "حفظ",
  "cancel": "إلغاء",
  "delete": "حذف",
  "edit": "تعديل",
  "search": "بحث",
  "filter": "تصفية",
  "export": "تصدير",
  "import": "استيراد",
  "yes": "نعم",
  "no": "لا",
  "ok": "موافق",
  "close": "إغلاق",
  "back": "رجوع",
  "next": "التالي",
  "previous": "السابق",
  "submit": "إرسال",
  "select": "اختر",
  "selectAll": "اختر الكل",
  "language": "اللغة",
  "arabic": "العربية",
  "english": "English",
  "settings": "الإعدادات",
  "logout": "تسجيل الخروج",
  "profile": "الملف الشخصي"
}
```

### `public/locales/en/common.json`

```json
{
  "appName": "Omnichannel CRM Platform",
  "welcome": "Welcome",
  "loading": "Loading...",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "search": "Search",
  "filter": "Filter",
  "export": "Export",
  "import": "Import",
  "yes": "Yes",
  "no": "No",
  "ok": "OK",
  "close": "Close",
  "back": "Back",
  "next": "Next",
  "previous": "Previous",
  "submit": "Submit",
  "select": "Select",
  "selectAll": "Select All",
  "language": "Language",
  "arabic": "العربية",
  "english": "English",
  "settings": "Settings",
  "logout": "Logout",
  "profile": "Profile"
}
```

### `public/locales/ar/auth.json`

```json
{
  "login": "تسجيل الدخول",
  "register": "إنشاء حساب",
  "email": "البريد الإلكتروني",
  "password": "كلمة المرور",
  "confirmPassword": "تأكيد كلمة المرور",
  "organizationName": "اسم المؤسسة",
  "fullName": "الاسم الكامل",
  "forgotPassword": "نسيت كلمة المرور؟",
  "rememberMe": "تذكرني",
  "loginButton": "دخول",
  "registerButton": "إنشاء حساب",
  "loginSuccess": "تم تسجيل الدخول بنجاح",
  "loginError": "فشل تسجيل الدخول",
  "invalidCredentials": "بيانات الدخول غير صحيحة",
  "emailRequired": "البريد الإلكتروني مطلوب",
  "passwordRequired": "كلمة المرور مطلوبة",
  "passwordMinLength": "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
  "organizationRequired": "اسم المؤسسة مطلوب",
  "alreadyHaveAccount": "لديك حساب بالفعل؟",
  "dontHaveAccount": "ليس لديك حساب؟",
  "createAccount": "إنشاء حساب جديد",
  "welcomeBack": "مرحباً بعودتك",
  "getStarted": "ابدأ الآن"
}
```

### `public/locales/en/auth.json`

```json
{
  "login": "Login",
  "register": "Register",
  "email": "Email",
  "password": "Password",
  "confirmPassword": "Confirm Password",
  "organizationName": "Organization Name",
  "fullName": "Full Name",
  "forgotPassword": "Forgot Password?",
  "rememberMe": "Remember Me",
  "loginButton": "Login",
  "registerButton": "Register",
  "loginSuccess": "Login successful",
  "loginError": "Login failed",
  "invalidCredentials": "Invalid credentials",
  "emailRequired": "Email is required",
  "passwordRequired": "Password is required",
  "passwordMinLength": "Password must be at least 8 characters",
  "organizationRequired": "Organization name is required",
  "alreadyHaveAccount": "Already have an account?",
  "dontHaveAccount": "Don't have an account?",
  "createAccount": "Create Account",
  "welcomeBack": "Welcome Back",
  "getStarted": "Get Started"
}
```

---

## 🎨 Component Usage Examples

### Language Provider Context

```javascript
// src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set document direction and language
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <LanguageContext.Provider value={{ changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
```

### Language Switcher Component

```javascript
// src/components/LanguageSwitcher.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
      aria-label={t('language')}
    >
      <Globe className="w-5 h-5" />
      <span>{i18n.language === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
};

export default LanguageSwitcher;
```

### Using Translations in Components

```javascript
// src/pages/Login.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const { t } = useTranslation('auth');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {t('login')}
        </h1>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg text-start"
              placeholder={t('email')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('password')}
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg text-start"
              placeholder={t('password')}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
          >
            {t('loginButton')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
```

---

## 🎨 RTL CSS Best Practices

### Use Logical Properties

```css
/* ❌ Avoid directional properties */
margin-left: 1rem;
padding-right: 0.5rem;
text-align: left;

/* ✅ Use logical properties */
margin-inline-start: 1rem;
padding-inline-end: 0.5rem;
text-align: start;
```

### Tailwind RTL Classes

```javascript
// ❌ Avoid
<div className="ml-4 mr-2 text-left">

// ✅ Use RTL-aware classes
<div className="ms-4 me-2 text-start">

// Common RTL classes:
ms-4  // margin-start (left in LTR, right in RTL)
me-2  // margin-end (right in LTR, left in RTL)
ps-4  // padding-start
pe-2  // padding-end
start-0  // left in LTR, right in RTL
end-0    // right in LTR, left in RTL
```

### Conditional Icon Direction

```javascript
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BackButton = () => {
  const { i18n } = useTranslation();
  const ArrowIcon = i18n.language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <button className="flex items-center gap-2">
      <ArrowIcon className="w-5 h-5" />
      <span>{t('back')}</span>
    </button>
  );
};
```

---

## 🔧 Backend Multi-Language Support

### Update Registration Endpoint

```javascript
// backend/routes/authRoutes.js
router.post('/register', async (req, res) => {
  const { organizationName, email, password, fullName, language = 'ar' } = req.body;

  // ... create user

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      // ... other fields
      preferred_language: language,
    });
});
```

### Multi-Language Email Templates

```javascript
// backend/services/emailTemplates.js
const getInvitationEmail = (language, data) => {
  const templates = {
    ar: {
      subject: `تمت دعوتك للانضمام إلى ${data.organizationName}`,
      body: `
        <h1>مرحباً</h1>
        <p>لقد تمت دعوتك للانضمام إلى <strong>${data.organizationName}</strong></p>
        <p><strong>دورك:</strong> ${data.role}</p>
        <a href="${data.inviteUrl}">قبول الدعوة</a>
      `,
    },
    en: {
      subject: `You're invited to join ${data.organizationName}`,
      body: `
        <h1>Hello</h1>
        <p>You've been invited to join <strong>${data.organizationName}</strong></p>
        <p><strong>Your Role:</strong> ${data.role}</p>
        <a href="${data.inviteUrl}">Accept Invitation</a>
      `,
    },
  };

  return templates[language];
};
```

---

## ✅ Testing Checklist

### Visual Testing
- [ ] All text displays correctly in Arabic
- [ ] All text displays correctly in English
- [ ] Layout mirrors properly in RTL
- [ ] Icons flip direction where needed
- [ ] Forms align correctly (labels, inputs)
- [ ] Navigation menus position correctly
- [ ] Modals and dropdowns position correctly

### Functional Testing
- [ ] Language switcher works
- [ ] Language persists after page reload
- [ ] User preference saved to database
- [ ] Email templates sent in correct language
- [ ] Date/time formatting respects locale
- [ ] Number formatting respects locale

---

## 📚 Resources

- [React i18next Documentation](https://react.i18next.com/)
- [Tailwind RTL Plugin](https://github.com/20lives/tailwindcss-rtl)
- [RTL CSS Best Practices](https://rtlstyling.com/)
- [Arabic UI/UX Guidelines](https://www.arabicux.com/)

---

**Last Updated**: 2025-10-02
**Languages Supported**: Arabic (ar), English (en)
**Default Language**: Arabic (ar)
