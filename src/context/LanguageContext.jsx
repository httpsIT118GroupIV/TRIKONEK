import { createContext, useContext, useEffect, useState } from 'react';

const dict = {
  en: {
    'app.name': 'TrikoNek',
    'login.title': 'Welcome back',
    'login.subtitle': 'Log in to find or drive a tricycle.',
    'login.button': 'Log in',
    'login.loading': 'Logging in...',
    'login.noAccount': "Don't have an account?",
    'login.register': 'Register',
    'register.title': 'Create account',
    'register.subtitle': 'Join TrikoNek in a minute.',
    'register.button': 'Create account',
    'register.loading': 'Creating...',
    'register.haveAccount': 'Already have an account?',
    'register.login': 'Log in',
    'field.username': 'Username',
    'field.email': 'Email',
    'field.password': 'Password',
    'field.passwordHint': 'At least 6 characters',
    'field.plate': 'Tricycle plate number',
    'field.iAm': 'I am a',
    'role.commuter': 'Commuter',
    'role.commuterDesc': 'Find a ride',
    'role.driver': 'Driver',
    'role.driverDesc': 'Get passengers',
  },
  tl: {
    'app.name': 'TrikoNek',
    'login.title': 'Maligayang pagbabalik',
    'login.subtitle': 'Mag-log in para maghanap o mag-drive ng tricycle.',
    'login.button': 'Mag-log in',
    'login.loading': 'Nagla-log in...',
    'login.noAccount': 'Wala ka pang account?',
    'login.register': 'Mag-register',
    'register.title': 'Gumawa ng account',
    'register.subtitle': 'Sumali sa TrikoNek sa isang minuto.',
    'register.button': 'Gumawa ng account',
    'register.loading': 'Ginagawa...',
    'register.haveAccount': 'May account ka na?',
    'register.login': 'Mag-log in',
    'field.username': 'Username',
    'field.email': 'Email',
    'field.password': 'Password',
    'field.passwordHint': 'Hindi bababa sa 6 na karakter',
    'field.plate': 'Plate number ng tricycle',
    'field.iAm': 'Ako ay isang',
    'role.commuter': 'Pasahero',
    'role.commuterDesc': 'Maghanap ng sakay',
    'role.driver': 'Driver',
    'role.driverDesc': 'Maghanap ng pasahero',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'en'; } catch { return 'en'; }
  });

  useEffect(() => {
    try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
    document.documentElement.lang = lang === 'tl' ? 'fil' : 'en';
  }, [lang]);

  const t = (key) => dict[lang]?.[key] ?? dict.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);