import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    console.log('🌗 ThemeProvider Mounting...');
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('appTheme');
        console.log('💾 Loaded theme from appTheme:', saved);
        return saved || 'dark';
    });

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        console.log('🔄 Toggling theme to:', newTheme);
        setTheme(newTheme);
        localStorage.setItem('appTheme', newTheme);
    };

    const setThemeExplicitly = (newTheme) => {
        if (newTheme === 'dark' || newTheme === 'light') {
            console.log('🎯 Setting theme explicitly to:', newTheme);
            setTheme(newTheme);
            localStorage.setItem('appTheme', newTheme);
        }
    };

    useEffect(() => {
        console.log('🌓 Applying theme effect:', theme);
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#09090B' : '#F9FAFB');
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setThemeExplicitly, isDarkMode: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        console.error('❌ useTheme used outside ThemeProvider!');
        const err = new Error('useTheme must be used within ThemeProvider');
        console.error(err.stack);
        throw err;
    }
    return context;
};

