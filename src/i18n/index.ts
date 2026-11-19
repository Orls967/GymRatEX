import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './locales/id';
import en from './locales/en';
import { usePrefs } from '../store/prefs';

export const resources = { id: { translation: id }, en: { translation: en } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: usePrefs.getState().lang,
  fallbackLng: 'id',
  interpolation: { escapeValue: false },
});

usePrefs.subscribe((s, prev) => {
  if (s.lang !== prev.lang) void i18n.changeLanguage(s.lang);
});

export default i18n;
