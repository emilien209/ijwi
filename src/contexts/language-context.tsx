
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { dictionaries, Dictionary } from "@/dictionaries";

type Language = "en" | "fr" | "kin";

interface LanguageContextType {
  lang: Language;
  dict: Dictionary;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("en");
  const [dict, setDict] = useState<Dictionary>(dictionaries.en);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const storedLang = localStorage.getItem("language") as Language | null;
      const browserLang = navigator.language.split('-')[0];
      
      let initialLang: Language = "en";

      if (storedLang && ["en", "fr", "kin"].includes(storedLang)) {
          initialLang = storedLang;
      } else if (browserLang === 'fr') {
          initialLang = 'fr';
      } else if (browserLang === 'rw') { // rw is the code for Kinyarwanda
          initialLang = 'kin';
      }

      setLang(initialLang);
      setDict(dictionaries[initialLang]);
    }
  }, [isMounted]);

  const handleSetLanguage = (newLang: Language) => {
    setLang(newLang);
    setDict(dictionaries[newLang]);
    localStorage.setItem("language", newLang);
  };

  const value = { lang, dict, setLanguage: handleSetLanguage };

  if (!isMounted) {
    // Render with default language on the server and initial client render
    return (
      <LanguageContext.Provider value={{ lang: 'en', dict: dictionaries.en, setLanguage: () => {} }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
