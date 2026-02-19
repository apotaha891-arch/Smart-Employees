import ar from './ar.json';
import en from './en.json';

const translations = { ar, en };

export const getTranslation = (language = 'ar') => {
  return translations[language] || translations.ar;
};

export const getNestedTranslation = (obj, path) => {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

export const useI18n = (lang = 'ar') => {
  const t = (key) => {
    const value = getNestedTranslation(translations[lang], key);
    if (!value) {
      console.warn(`Translation missing for key: ${key} in language: ${lang}`);
      return key;
    }
    return value;
  };

  return { t, lang, translations: translations[lang] };
};

export default translations;
