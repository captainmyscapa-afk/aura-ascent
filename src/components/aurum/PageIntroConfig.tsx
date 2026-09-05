import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Map,
  Radio,
  Sparkles,
  GraduationCap,
  BookOpen,
  Video,
  CalendarDays,
  Users,
  User2,
} from "lucide-react";
import type { T } from "@/lib/i18n/translations";
import type { PageIntroKey } from "./PageIntro";

export type PageIntroDef = {
  pageKey: PageIntroKey;
  icon: ComponentType<{ className?: string }>;
  title: (t: T) => string;
  description: (t: T) => string;
  features: (t: T) => string[];
};

// One entry per sidebar destination, keyed by route pathname. Icons mirror
// Sidebar.tsx's nav icons so the welcome overlay and the nav item it belongs
// to always read as the same page.
export const PAGE_INTROS: Record<string, PageIntroDef> = {
  "/app": {
    pageKey: "dashboard",
    icon: LayoutDashboard,
    title: (t) => t.navDashboard,
    description: (t) => t.introDashboardDesc,
    features: (t) => t.introDashboardFeatures,
  },
  "/roadmap": {
    pageKey: "roadmap",
    icon: Map,
    title: (t) => t.navRoadmap,
    description: (t) => t.introRoadmapDesc,
    features: (t) => t.introRoadmapFeatures,
  },
  "/intelligence": {
    pageKey: "intelligence",
    icon: Radio,
    title: (t) => t.navIntelligence,
    description: (t) => t.introIntelligenceDesc,
    features: (t) => t.introIntelligenceFeatures,
  },
  "/mentor": {
    pageKey: "mentor",
    icon: Sparkles,
    title: (t) => t.navMentor,
    description: (t) => t.introMentorDesc,
    features: (t) => t.introMentorFeatures,
  },
  "/academy": {
    pageKey: "academy",
    icon: GraduationCap,
    title: (t) => t.navAcademy,
    description: (t) => t.introAcademyDesc,
    features: (t) => t.introAcademyFeatures,
  },
  "/tutor": {
    pageKey: "tutor",
    icon: BookOpen,
    title: (t) => t.navTutor,
    description: (t) => t.introTutorDesc,
    features: (t) => t.introTutorFeatures,
  },
  "/studio": {
    pageKey: "studio",
    icon: Video,
    title: (t) => t.navStudio,
    description: (t) => t.introStudioDesc,
    features: (t) => t.introStudioFeatures,
  },
  "/calendar": {
    pageKey: "calendar",
    icon: CalendarDays,
    title: (t) => t.navCalendar,
    description: (t) => t.introCalendarDesc,
    features: (t) => t.introCalendarFeatures,
  },
  "/network": {
    pageKey: "network",
    icon: Users,
    title: (t) => t.navNetwork,
    description: (t) => t.introNetworkDesc,
    features: (t) => t.introNetworkFeatures,
  },
  "/profile": {
    pageKey: "profile",
    icon: User2,
    title: (t) => t.navIdentity,
    description: (t) => t.introProfileDesc,
    features: (t) => t.introProfileFeatures,
  },
};
