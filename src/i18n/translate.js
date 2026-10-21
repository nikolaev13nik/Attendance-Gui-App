import en from "./en.js";
import ru from "./ru.js";
import he from "./he.js";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr", messages: en },
  { code: "ru", label: "Русский", dir: "ltr", messages: ru },
  { code: "he", label: "עברית", dir: "rtl", messages: he },
];

let current = LANGUAGES[0];

export function findLanguage(code) {
  return LANGUAGES.find((language) => language.code === code);
}

export function setCurrentLanguage(code) {
  current = findLanguage(code) || LANGUAGES[0];
}

export function currentLocale() {
  return current.code;
}

function lookup(key) {
  return current.messages[key] ?? en[key];
}

function pluralKey(key, count) {
  const form = new Intl.PluralRules(current.code).select(count);
  if (lookup(`${key}.${form}`) !== undefined) {
    return `${key}.${form}`;
  }
  return lookup(`${key}.other`) !== undefined ? `${key}.other` : key;
}

export function hasMessage(key) {
  return lookup(key) !== undefined;
}

export function translate(key, params) {
  const resolved = params && typeof params.count === "number" ? pluralKey(key, params.count) : key;
  const template = lookup(resolved) ?? key;
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}
