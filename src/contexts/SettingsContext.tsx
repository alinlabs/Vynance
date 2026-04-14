import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';

interface SettingsContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: string;
  setLanguage: (lang: string) => void;
  currency: string;
  setCurrency: (curr: string) => void;
  numberFormatMode: 'separator' | 'compact';
  setNumberFormatMode: (mode: 'separator' | 'compact') => void;
  numberFormatDecimals: number;
  setNumberFormatDecimals: (decimals: number) => void;
  numberFormatSystem: 'intl' | 'id';
  setNumberFormatSystem: (system: 'intl' | 'id') => void;
  t: (text: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('vinance_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [language, setLanguageState] = useState(() => localStorage.getItem('vinance_language') || 'id');
  const [currency, setCurrencyState] = useState(() => localStorage.getItem('vinance_currency') || 'IDR');
  const [numberFormatMode, setNumberFormatModeState] = useState<'separator' | 'compact'>(() => (localStorage.getItem('vinance_number_format_mode') as 'separator' | 'compact') || 'separator');
  const [numberFormatDecimals, setNumberFormatDecimalsState] = useState<number>(() => parseInt(localStorage.getItem('vinance_number_format_decimals') || '0', 10));
  const [numberFormatSystem, setNumberFormatSystemState] = useState<'intl' | 'id'>(() => (localStorage.getItem('vinance_number_format_system') as 'intl' | 'id') || 'id');

  const [translations, setTranslations] = useState<Record<string, string>>(() => {
    const cached = localStorage.getItem(`vinance_translations_${language}`);
    return cached ? JSON.parse(cached) : {};
  });

  const fetchingSet = useRef(new Set<string>());

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('vinance_theme', newTheme);
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('vinance_language', lang);
    const cached = localStorage.getItem(`vinance_translations_${lang}`);
    setTranslations(cached ? JSON.parse(cached) : {});
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    localStorage.setItem('vinance_currency', curr);
  };

  const setNumberFormatMode = (mode: 'separator' | 'compact') => {
    setNumberFormatModeState(mode);
    localStorage.setItem('vinance_number_format_mode', mode);
  };

  const setNumberFormatDecimals = (decimals: number) => {
    setNumberFormatDecimalsState(decimals);
    localStorage.setItem('vinance_number_format_decimals', decimals.toString());
  };

  const setNumberFormatSystem = (system: 'intl' | 'id') => {
    setNumberFormatSystemState(system);
    localStorage.setItem('vinance_number_format_system', system);
  };

  const fetchTranslation = async (text: string, lang: string) => {
    if (fetchingSet.current.has(text)) return;
    fetchingSet.current.add(text);

    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=id|${lang}`);
      const data = await res.json();
      if (data.responseData?.translatedText) {
        setTranslations(prev => {
          const next = { ...prev, [text]: data.responseData.translatedText };
          localStorage.setItem(`vinance_translations_${lang}`, JSON.stringify(next));
          return next;
        });
      }
    } catch (e) {
      console.error('Translation error:', e);
    }
  };

  const t = (text: string) => {
    if (!text || language === 'id') return text;
    if (translations[text]) return translations[text];
    
    fetchTranslation(text, language);
    return text;
  };

  return (
    <SettingsContext.Provider value={{ 
      theme, setTheme,
      language, setLanguage, 
      currency, setCurrency, 
      numberFormatMode, setNumberFormatMode,
      numberFormatDecimals, setNumberFormatDecimals,
      numberFormatSystem, setNumberFormatSystem,
      t 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
};
