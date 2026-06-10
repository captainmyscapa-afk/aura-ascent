import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { translations, type Lang, type T } from "./translations";

const STORAGE_KEY = "aurum.language";
const DEFAULT: Lang = "en";

type Ctx = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: T;
};

const LanguageContext = createContext<Ctx | null>(null);

function isLang(v: string | null): v is Lang {
  return v === "en" || v === "fr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
