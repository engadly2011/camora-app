// ─────────────────────────────────────────────────────────────────────────────
// i18n barrel — single import point for all locale utilities.
// ─────────────────────────────────────────────────────────────────────────────

export { en }         from "./en";
export { ar }         from "./ar";
export type { Dictionary, Locale, Dir, SharedNS, HeaderNS, EngineOptionsNS,
              CameraRowNS, SceneOptionsNS, RecordingModeNS, ResultsNS } from "./types";

import { en } from "./en";
import { ar } from "./ar";
import type { Dictionary, Locale, Dir } from "./types";

export const DICTIONARIES: Record<Locale, Dictionary> = { en, ar };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export function getDir(locale: Locale): Dir {
  return locale === "ar" ? "rtl" : "ltr";
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};
