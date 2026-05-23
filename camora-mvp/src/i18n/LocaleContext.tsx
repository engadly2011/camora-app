"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LocaleContext
//
// Provides the current locale and dictionary to all descendants.
// Switching locale updates the <html> dir/lang attributes in real time
// without a full page navigation.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext, useContext, useState, useCallback,
  useEffect, type ReactNode,
} from "react";
import { getDictionary, getDir } from "./index";
import type { Locale, Dictionary } from "./types";

interface LocaleContextValue {
  locale:     Locale;
  dict:       Dictionary;
  dir:        "ltr" | "rtl";
  setLocale:  (l: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "camora-locale";

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ar") return stored;
  // Respect browser language preference
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith("ar") ? "ar" : "en";
}

interface LocaleProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

export function LocaleProvider({ children, defaultLocale = "en" }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Hydrate from localStorage after mount
  useEffect(() => {
    const resolved = resolveInitialLocale();
    if (resolved !== locale) setLocaleState(resolved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync <html> dir and lang attributes
  useEffect(() => {
    const dir = getDir(locale);
    document.documentElement.lang = locale;
    document.documentElement.dir  = dir;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const value: LocaleContextValue = {
    locale,
    dict:   getDictionary(locale),
    dir:    getDir(locale),
    setLocale,
    toggleLocale,
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
