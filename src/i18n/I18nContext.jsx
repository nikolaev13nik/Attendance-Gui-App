import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./en.js";
import ru from "./ru.js";
import he from "./he.js";

const STORAGE_KEY = "attendance.lang";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr", messages: en },
  { code: "ru", label: "Русский", dir: "ltr", messages: ru },
  { code: "he", label: "עברית", dir: "rtl", messages: he },
];

const I18nContext = createContext(null);

function findLanguage(code) {
  return LANGUAGES.find((language) => language.code === code);
}

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

function format(template, params) {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(readStored);
  const language = findLanguage(lang);

  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir;
  }, [language]);

  const setLang = useCallback((code) => {
    if (findLanguage(code)) {
      writeStored(code);
      setLangState(code);
    }
  }, []);

  const t = useCallback(
    (key, params) => format(language.messages[key] ?? en[key] ?? key, params),
    [language],
  );

  const value = useMemo(() => ({ lang, dir: language.dir, setLang, t }), [lang, language, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
