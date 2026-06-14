import React, { createContext, useContext, useState } from "react";
import { t as translate } from "../translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem("aiycom_lang") || "en";
    document.documentElement.setAttribute("data-lang", saved);
    return saved;
  });

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem("aiycom_lang", l);
    document.documentElement.setAttribute("data-lang", l);
  };

  const t = (key) => translate(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
