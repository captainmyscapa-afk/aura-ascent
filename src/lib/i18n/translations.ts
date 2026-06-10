export type Lang = "en" | "fr";

export type T = {
  navDashboard: string;
  navRoadmap: string;
  navIntelligence: string;
  navMentor: string;
  navAcademy: string;
  navTutor: string;
  navNetwork: string;
  navStudio: string;
  navIdentity: string;
  navPreferences: string;
  ecosystem: string;
  momentum: string;
  signOut: string;
  signInUnlock: string;
  streak: (n: number) => string;
  industryLabel: string;
  enteringMode: (label: string) => string;
  live: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  evening: string;
  morning: string;
  daylight: string;
  worldRhythmPre: string;
  worldRhythmEm: string;
  cityNotFound: string;
  cityPlaceholder: string;
  langEnglish: string;
  langFrench: string;
};

export const translations: Record<Lang, T> = {
  en: {
    // Navigation
    navDashboard: "Mission Control",
    navRoadmap: "30-Day Roadmap",
    navIntelligence: "Intelligence",
    navMentor: "AI Mentor",
    navAcademy: "Academy",
    navTutor: "AI Tutor",
    navNetwork: "Network",
    navStudio: "Content Studio",
    navIdentity: "Identity",
    navPreferences: "Preferences",
    // Sidebar
    ecosystem: "ECOSYSTEM",
    momentum: "MOMENTUM",
    signOut: "Sign out",
    signInUnlock: "Sign in to unlock",
    streak: (n: number) => `${n}-day streak`,
    // Industry switcher
    industryLabel: "INDUSTRY ECOSYSTEM",
    enteringMode: (label: string) => `Entering ${label}`,
    // Global Time Hub
    live: "Live",
    today: "TODAY",
    tomorrow: "TOMORROW",
    yesterday: "YESTERDAY",
    evening: "Evening",
    morning: "Morning",
    daylight: "Daylight",
    worldRhythmPre: "The rhythm of the",
    worldRhythmEm: "world",
    cityNotFound: "City not found",
    cityPlaceholder: "City name…",
    // Language names
    langEnglish: "English",
    langFrench: "Français",
  },
  fr: {
    // Navigation
    navDashboard: "Contrôle Mission",
    navRoadmap: "Plan 30 Jours",
    navIntelligence: "Intelligence",
    navMentor: "Mentor IA",
    navAcademy: "Académie",
    navTutor: "Tuteur IA",
    navNetwork: "Réseau",
    navStudio: "Studio Contenu",
    navIdentity: "Identité",
    navPreferences: "Préférences",
    // Sidebar
    ecosystem: "ÉCOSYSTÈME",
    momentum: "ÉLAN",
    signOut: "Se déconnecter",
    signInUnlock: "Se connecter",
    streak: (n: number) => `Série de ${n} jours`,
    // Industry switcher
    industryLabel: "ÉCOSYSTÈME",
    enteringMode: (label: string) => `Entrée dans ${label}`,
    // Global Time Hub
    live: "En direct",
    today: "AUJOURD'HUI",
    tomorrow: "DEMAIN",
    yesterday: "HIER",
    evening: "Soir",
    morning: "Matin",
    daylight: "Journée",
    worldRhythmPre: "Le rythme du",
    worldRhythmEm: "monde",
    cityNotFound: "Ville introuvable",
    cityPlaceholder: "Nom de ville…",
    // Language names
    langEnglish: "English",
    langFrench: "Français",
  },
};
