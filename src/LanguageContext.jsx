import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

// Helper function to get nested translations with dot notation
const getNestedTranslation = (obj, path) => {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        // Get saved language from localStorage or default to Arabic
        return localStorage.getItem('appLanguage') || 'ar';
    });

    const t = (key) => {
        const value = getNestedTranslation(translations[language], key);
        if (!value) {
            console.warn(`Translation missing for key: ${key} in language: ${language}`);
            // Fallback to Arabic if key missing
            const fallback = getNestedTranslation(translations.ar, key);
            return fallback || key;
        }
        return value;
    };

    const toggleLanguage = () => {
        const newLang = language === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
        localStorage.setItem('appLanguage', newLang);
    };

    const switchLanguage = (lang) => {
        if (lang === 'ar' || lang === 'en') {
            setLanguage(lang);
            localStorage.setItem('appLanguage', lang);
        }
    };

    // Update HTML attributes when language changes
    useEffect(() => {
        const html = document.documentElement;

        if (language === 'ar') {
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
        } else {
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
        }
    }, [language]);

    const value = {
        language,
        t,
        toggleLanguage,
        switchLanguage,
        isArabic: language === 'ar',
        isEnglish: language === 'en',
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
