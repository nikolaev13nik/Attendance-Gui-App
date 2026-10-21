import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = new URL("..", import.meta.url).pathname;
const BASE = "en";
const OTHERS = ["ru", "he"];
const PLURAL = /\.(zero|one|two|few|many|other)$/;
const DYNAMIC_PREFIXES = ["role.", "leave."];

async function load(code) {
  const module = await import(pathToFileURL(join(root, "src/i18n", `${code}.js`)).href);
  return module.default;
}

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(js|jsx)$/.test(entry.name) ? [path] : [];
  });
}

function baseKey(key) {
  return key.replace(PLURAL, "");
}

function placeholders(template, ignoreCount) {
  const names = [...template.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
  return [...new Set(names.filter((name) => !(ignoreCount && name === "count")))].sort().join(",");
}

const errors = [];
const warnings = [];
const base = await load(BASE);
const baseKeys = new Set(Object.keys(base).map(baseKey));

const code = sourceFiles(join(root, "src"))
  .filter((path) => !path.includes(join("src", "i18n")))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
const used = new Set(
  [...code.matchAll(/\b(?:t|msg)\(\s*"([\w.]+)"/g), ...code.matchAll(/"(api\.[\w.]+)"/g)].map((match) => match[1]),
);

for (const key of used) {
  if (!baseKeys.has(key)) {
    errors.push(`${BASE}: key "${key}" is used in src/ but not defined`);
  }
}

for (const key of baseKeys) {
  if (!used.has(key) && !DYNAMIC_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    warnings.push(`${BASE}: key "${key}" is defined but never used`);
  }
}

for (const lang of OTHERS) {
  const messages = await load(lang);
  const keys = new Set(Object.keys(messages).map(baseKey));
  for (const key of baseKeys) {
    if (!keys.has(key)) {
      errors.push(`${lang}: missing key "${key}"`);
    }
  }
  for (const key of keys) {
    if (!baseKeys.has(key)) {
      errors.push(`${lang}: key "${key}" does not exist in ${BASE}`);
    }
  }
  for (const [key, template] of Object.entries(messages)) {
    const plural = PLURAL.test(key);
    const reference = base[key] ?? base[`${baseKey(key)}.other`];
    if (reference === undefined) {
      continue;
    }
    if (plural && !(`${baseKey(key)}.other` in messages)) {
      errors.push(`${lang}: plural key "${baseKey(key)}" has no ".other" form`);
    }
    if (placeholders(template, plural) !== placeholders(reference, plural)) {
      errors.push(`${lang}: "${key}" uses {${placeholders(template, plural)}} but ${BASE} uses {${placeholders(reference, plural)}}`);
    }
  }
}

warnings.forEach((line) => console.warn(`warning  ${line}`));
errors.forEach((line) => console.error(`error    ${line}`));

if (errors.length > 0) {
  console.error(`\ni18n check failed: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`i18n check passed: ${baseKeys.size} keys in ${[BASE, ...OTHERS].join(", ")}`);
