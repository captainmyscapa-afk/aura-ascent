import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { INDUSTRIES } from "./config";
import type { IndustryConfig, IndustryId } from "./types";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";

const STORAGE_KEY = "aurum.industry";
const DEFAULT: IndustryId = "yachts";

type Ctx = {
  industryId: IndustryId;
  industry: IndustryConfig;
  setIndustry: (id: IndustryId) => void;
};

const IndustryContext = createContext<Ctx | null>(null);

function isIndustry(v: string | null): v is IndustryId {
  return v === "yachts" || v === "villas" || v === "jets" || v === "cars";
}

export function IndustryProvider({ children }: { children: ReactNode }) {
  const [industryId, setIndustryId] = useState<IndustryId>(DEFAULT);

  // hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isIndustry(stored)) setIndustryId(stored);
  }, []);

  // reflect to <html data-industry="...">
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-industry", industryId);
  }, [industryId]);

  const setIndustry = useCallback((id: IndustryId) => {
    setIndustryId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ industryId, industry: INDUSTRIES[industryId], setIndustry }),
    [industryId, setIndustry],
  );

  return <IndustryContext.Provider value={value}>{children}</IndustryContext.Provider>;
}

export function useIndustry(): Ctx {
  const ctx = useContext(IndustryContext);
  if (!ctx) throw new Error("useIndustry must be used within IndustryProvider");
  return ctx;
}

export function useIndustrySystemPrompt(level?: string) {
  const { industry } = useIndustry();
  return `You are AURUM AI mentoring ${level ? `a ${level} ` : ""}entering ${industry.label} (${industry.tagline}). Persona: ${industry.mentorPersona}. Specialty: ${industry.mentorSpecialty}. Use industry terminology: client="${industry.terms.client}", asset="${industry.terms.asset}", market="${industry.terms.market}".`;
}
