import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { findLanguage, hasMessage, setCurrentLanguage, translate } from "./translate.js";

export { LANGUAGES } from "./translate.js";

const STORAGE_KEY = "attendance.lang";

const I18nContext = createContext(null);

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (findLanguage(stored)) {
      return stored;
    }
  } catch {}
  const browser = (navigator.language || "en").slice(0, 2);
  return findLanguage(browser) ? browser : "en";
}

function writeStored(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {}
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const initial = readStored();
    setCurrentLanguage(initial);
    return initial;
  });
  const language = findLanguage(lang);

  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir;
  }, [language]);

  const setLang = useCallback((code) => {
    if (findLanguage(code)) {
      setCurrentLanguage(code);
      writeStored(code);
      setLangState(code);
    }
  }, []);

  const t = useCallback((key, params) => translate(key, params), [lang]);

  const roleLabel = useCallback(
    (role) => {
      const key = `role.${String(role).toUpperCase()}`;
      return hasMessage(key) ? t(key) : role;
    },
    [t],
  );

  const value = useMemo(
    () => ({ lang, dir: language.dir, setLang, t, roleLabel }),
    [lang, language, setLang, t, roleLabel],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
