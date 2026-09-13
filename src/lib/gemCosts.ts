// CAP-147: Aurum Gems cost per premium AI action. Single source of truth so
// every call site (Studio, Mentor, Tutor, Roadmap, Dashboard) spends the
// same amount for the same action.
export const GEM_COSTS = {
  imageGeneration: 100,
  mentorNewConversation: 2,
  tutorNewConversation: 2,
  readArticle: 1,
  studioGenerateAiAssisted: 2,
  studioGenerateFromLiveIntel: 5,
  roadmapGetHelp: 1,
  roadmapSwapTask: 1,
  mentorHelpPerTask: 1,
} as const;

export type GemAction = keyof typeof GEM_COSTS;
