import type { LucideIcon } from "lucide-react";

export type IndustryId = "yachts" | "villas" | "jets" | "cars";

export type IntelItem = {
  tag: string;
  title: string;
  note: string;
  time: string;
  region: string;
};

export type IndustryConfig = {
  id: IndustryId;
  label: string;
  shortLabel: string;
  modeLabel: string; // e.g. "Yacht Mode"
  icon: LucideIcon;
  tagline: string;
  ambientImage: string;

  // Mentor
  mentorPersona: string; // e.g. "AURUM · Yachting Counsel"
  mentorSpecialty: string;
  mentorOpener: string;
  mentorPrompts: string[];

  // Dashboard
  greetingSubtitle: string;
  phaseLabel: string;
  dailyObjectives: string[];
  marketTrends: string[];
  upcoming: Array<[string, string]>; // [date, title]
  aiRecommendation: string;

  // Intelligence
  intelFeed: IntelItem[];

  // Network
  circles: Array<{ name: string; members: number; tier: string; note: string }>;
  people: Array<{ n: string; r: string; c: string; tier: string }>;
  introContext: string;

  // Studio
  contentPrompts: Array<{ type: string; t: string }>;
  studioActions: Array<{ label: string; desc: string }>;

  // Academy
  trackName: string;
  trackModules: number;
  trackProgress: number;
  modules: Array<{ n: string; t: string; dur: string; state?: "done" | "current" | "locked" }>;
  tutorBlurb: string;

  // Terms
  terms: { client: string; asset: string; market: string };
};
