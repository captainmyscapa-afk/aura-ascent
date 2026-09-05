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
  navCalendar: string;
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
  proFeatureLabel: string;
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
  // Dashboard
  dashDemoMode: string;
  dashDemoMessage: string;
  dashSignIn: string;
  dashFreePlan: string;
  dashUpgradeMessage: string;
  dashUpgradeCta: string;
  greeting: (period: "morning" | "afternoon" | "evening") => string;
  dashSpeakWithAurum: string;
  dashOpenIntelligence: string;
  dashTodayEyebrow: (mode: string) => string;
  dashDailyRitual: string;
  dashOfCount: (completed: number, total: number) => string;
  dashAllComplete: string;
  dashAcademyEyebrow: string;
  dashYourTracks: string;
  dashComingSoon: string;
  dashTrackComplete: (done: number, total: number) => string;
  dashMomentumLabel: (pct: number) => string;
  dashAllIndustries: string;
  dashSelectEvent: string;
  dashSelectEventDesc: string;
  dashDaysAway: (n: number) => string;
  dashHappeningToday: string;
  dashEventPassed: string;
  dashContentPrepWindow: string;
  dashStartPosting: (weeks: number) => string;
  dashContentWindowOpensIn: (days: number, date: string) => string;
  dashContentWindowOpenNow: string;
  dashEventHasPassed: string;
  dashCreateContentForEvent: string;
  dashVisitOfficialSite: string;
  dashWelcomes: string[];
  dashCompletionMessages: string[];
  monthShort: string[];
  weekdayLetters: string[];
  // Calendar
  calEyebrow: string;
  calHeroPre: string;
  calHeroEm: string;
  calSubtitle: string;
  calAddTask: string;
  calToday: string;
  calRitualLabel: string;
  calRoadmapLabel: string;
  calLegendDue: string;
  calLegendOverdue: string;
  calLegendEvent: string;
  calNoActivity: string;
  calDayTasksDone: (n: number) => string;
  calDueToday: string;
  calOverdue: string;
  calUpcoming: string;
  calModalTitle: string;
  calModalTitleLabel: string;
  calModalTitlePlaceholder: string;
  calModalDescLabel: string;
  calModalDescPlaceholder: string;
  calModalDueLabel: string;
  calModalReminderLabel: string;
  calModalReminderHint: string;
  calModalPriorityLabel: string;
  calPriorityLow: string;
  calPriorityMedium: string;
  calPriorityHigh: string;
  calModalSave: string;
  calModalSaving: string;
  calModalCancel: string;
  calDeleteTask: string;
  calMarkDone: string;
  calMarkUndone: string;
  calEmptyDay: string;
  calSelectDayHint: string;
  calStreakLabel: (n: number) => string;
  calMonthCompletion: (pct: number) => string;
  calReminderSet: string;
  calReminderBadge: string;
  calDragToReschedule: string;
  // Calendar — Community events
  calCommunityTitle: string;
  calCommunityDesc: string;
  calShareEvent: string;
  calNoEvents: string;
  calNoEventsDesc: string;
  calLoadingEvents: string;
  calEventModalTitle: string;
  calEventTitleLabel: string;
  calEventTitlePlaceholder: string;
  calEventDescLabel: string;
  calEventDescPlaceholder: string;
  calEventLocationLabel: string;
  calEventLocationPlaceholder: string;
  calEventStartLabel: string;
  calEventEndLabel: string;
  calEventSave: string;
  calEventSaving: string;
  calRsvp: string;
  calRsvped: string;
  calAttendees: (n: number) => string;
  calDeleteEvent: string;
  calOrganizedBy: (name: string) => string;
  // Roadmap
  roadmapEyebrow: (mode: string) => string;
  roadmapBuilding: string;
  roadmapDefaultHeadline: string;
  roadmapDescription: string;
  roadmapRegenerate: string;
  roadmapGenerating: string;
  roadmapOverallProgress: string;
  roadmapArchitecting: string;
  roadmapArchitectingDesc: (industry: string) => string;
  roadmapWeekLabel: (n: number) => string;
  roadmapWeekHeader: (n: number) => string;
  roadmapMilestone: string;
  roadmapPrevWeek: string;
  roadmapNextWeek: string;
  roadmapGetHelp: string;
  roadmapHideHelp: string;
  roadmapHelpLoading: string;
  roadmapHelpFailed: string;
  roadmapSwapTask: string;
  roadmapSwapping: string;
  roadmapSwapFailed: string;
  roadmapContinueInMentor: string;
  roadmapHelpGateMessage: string;
  roadmapMarkComplete: string;
  roadmapMarkIncomplete: string;
  roadmapLockTitle: string;
  roadmapLockDesc: string;
  roadmapLockFeatures: string[];
  typeNetworking: string;
  typeContent: string;
  typeLearning: string;
  typeOutreach: string;
  typeMindset: string;
  // Intelligence
  intelEyebrow: (mode: string, category: string) => string;
  intelHeadline: string;
  intelDescPre: string;
  intelYour: string;
  intelDescPost: (industry: string) => string;
  intelLive: string;
  intelSync: (time: string) => string;
  intelSyncing: string;
  intelJustNow: string;
  intelMinAgo: (n: number) => string;
  intelHourAgo: (n: number) => string;
  intelDayAgo: (n: number) => string;
  intelSignalsTracked: string;
  intelSources: string;
  intelRealtime: string;
  intelOn: string;
  intelLatest: string;
  intelSignalsOf: (category: string) => string;
  intelReadBrief: string;
  intelGenerateContent: string;
  categoryLabel: (category: string) => string;
  // Mentor
  mentorMinAgo: (n: number) => string;
  mentorHourAgo: (n: number) => string;
  mentorYesterday: string;
  mentorOpener: (greeting: string, userName: string, persona: string, industry: string) => string;
  mentorThinking: string;
  mentorPlaceholder: (industry: string) => string;
  mentorFreeMessages: string;
  mentorOnline: string;
  mentorNewConversation: string;
  mentorRecentConversations: string;
  mentorConvMeta: (date: string, n: number) => string;
  mentorDeleteConversation: string;
  mentorQuickInvocations: string;
  mentorContextLoaded: string;
  mentorExecutionStreak: (n: number) => string;
  mentorTasksCompletedToday: (n: number) => string;
  mentorGateMessage: string;
  mentorGateMessageModal: string;
  mentorErrorPrefix: string;
  mentorContent: (industryId: "yachts" | "villas" | "jets" | "cars") => { persona: string; specialty: string; prompts: string[] };
  // Academy
  acadEyebrow: (mode: string) => string;
  acadHeroPre: string;
  acadHeroEm: string;
  acadTracks: string;
  acadIndustryCurricula: string;
  acadModules: (n: number) => string;
  acadComingSoon: string;
  acadComplete: (done: number, total: number) => string;
  acadComingSoonTitle: (trackName: string) => string;
  acadComingSoonDesc: string;
  acadAiTutorTitle: string;
  acadBeginRolePlay: string;
  acadCourseComingSoon: string;
  acadCourseComingSoonDesc: string;
  acadAdminViewNotice: string;
  acadActiveTrack: (track: string) => string;
  acadYachtBrokerage: string;
  acadYourProgramme: string;
  acadOfTenComplete: (n: number) => string;
  acadAdmin: string;
  acadPhase: (num: string | number, title: string) => string;
  acadVideoAvailable: string;
  acadNoVideoYet: string;
  acadStart: string;
  acadBackToModules: string;
  acadModuleOf: (num: string, phase: number) => string;
  acadCompleted: string;
  acadClose: string;
  acadEdit: string;
  acadMarkWatched: string;
  acadVideoComingSoon: string;
  acadAddVideoUrlHint: string;
  acadDownloads: string;
  acadModuleQuiz: string;
  acadQuizPassed: string;
  acadScoreNextUnlocked: (score: number | null | undefined) => string;
  acadAddQuestionsHint: string;
  acadQuizComingSoon: string;
  acadQuizInstructions: string;
  acadLastScore: (score: number | null | undefined, attempts: number | undefined) => string;
  acadRetryQuiz: string;
  acadTakeQuiz: string;
  acadBackToModule: string;
  acadQuizModule: (num: string) => string;
  acadAnswerAll: string;
  acadModuleComplete: string;
  acadScoredUnlocked: (score: number) => string;
  acadContinue: string;
  acadNotQuite: string;
  acadScoredRetry: (score: number, pass: number) => string;
  acadTryAgain: string;
  acadSubmitAnswers: string;
  acadSubmitting: string;
  acadSubmitFailed: string;
  acadPhaseTitle: (phaseNumber: number, fallback: string) => string;
  acadModuleTitle: (track: string, moduleNumber: number, fallback: string) => string;
  acadTutorBlurb: (industryId: "yachts" | "villas" | "jets" | "cars") => string;
  // Tutor
  tutTitle: string;
  tutSubtitle: (trackName: string) => string;
  tutOnline: string;
  tutComposing: string;
  tutPlaceholder: (industryId: "yachts" | "villas" | "jets" | "cars") => string;
  tutNewLesson: string;
  tutRecentLessons: string;
  tutDeleteLesson: string;
  tutMessagesCount: (n: number) => string;
  tutMinsAgo: (n: number) => string;
  tutHoursAgo: (n: number) => string;
  tutYesterday: string;
  tutLessonStarters: string;
  tutActiveTrackLabel: string;
  tutModulesComplete: (done: number, total: number) => string;
  tutModeLine: (mode: string) => string;
  tutPhaseLine: (phase: string) => string;
  tutOpener: (trackName: string) => string;
  tutSuggestions: (industryId: "yachts" | "villas" | "jets" | "cars") => string[];
  tutGateMessage: string;
  tutLockTitle: string;
  tutLockDesc: string;
  tutLockFeatures: string[];
  // Network
  netEyebrow: (mode: string) => string;
  netHeroPre: string;
  netHeroEm: string;
  netSubtitle: string;
  netTabContacts: (n: number) => string;
  netTabDrafts: (n: number) => string;
  netTabCompose: string;
  netYourNetwork: string;
  netContacts: string;
  netAddContact: string;
  netNewContact: string;
  netNotesPlaceholder: string;
  netCancel: string;
  netSaveContact: string;
  netLoadingContacts: string;
  netNoContacts: string;
  netNoContactsDesc: string;
  netDraftMessage: string;
  netOutreach: string;
  netDraftAMessage: string;
  netTo: string;
  netAddContactFirst: string;
  netPlatform: string;
  netRoleCategory: string;
  netCategories: (industryId: "yachts" | "villas" | "jets" | "cars") => string[];
  netDefaultCategories: string[];
  netSubject: string;
  netSubjectPlaceholder: string;
  netSelectContactHint: string;
  netSelectContactFirstError: string;
  netDraftFailed: string;
  netGateMessage: string;
  netDrafting: string;
  netDraftMessageTo: (name: string) => string;
  netSelectContactFirstBtn: string;
  netMessage: string;
  netMessagePlaceholder: string;
  netCopied: string;
  netCopy: string;
  netSaveDraft: string;
  netSend: string;
  netHistory: string;
  netDraftsTitle: string;
  netLoading: string;
  netNoMessages: string;
  netNoMessagesDesc: string;
  netStatusSent: string;
  netStatusDraft: string;
  netJustNow: string;
  netHoursAgo: (h: number) => string;
  netYesterday: string;
  netModifyDraft: string;
  netDeleteDraft: string;
  netRe: (subject: string) => string;
  // Network — Community board
  comTab: string;
  comSectionEyebrow: string;
  comBoardTitle: string;
  comBoardDesc: string;
  comNewPost: string;
  comPostTitlePlaceholder: string;
  comPostBodyPlaceholder: string;
  comPublish: string;
  comPosting: string;
  comPostFailed: string;
  comEmptyTitle: string;
  comEmptyDesc: string;
  comLoading: string;
  comBack: string;
  comRepliesCount: (n: number) => string;
  comReplyPlaceholder: string;
  comReplyButton: string;
  comReplyingBtn: string;
  comReplyFailed: string;
  comNoReplies: string;
  comNoRepliesDesc: string;
  comDeletePost: string;
  comDeleteReply: string;
  comReport: string;
  comReportTitle: string;
  comReportReasonPlaceholder: string;
  comReportSubmit: string;
  comReportSuccess: string;
  comReportFailed: string;
  comMember: string;
  comYou: string;
  comUpvote: string;
  // Studio
  stuGateMessage: string;
  stuUpgradeReason: string;
  stuGenerationFailed: string;
  stuEyebrow: (mode: string) => string;
  stuFreeDraftLabel: string;
  stuHeroPre: string;
  stuHeroEm: string;
  stuSubtitle: (label: string) => string;
  stuTags: string[];
  stuHistory: (n: number) => string;
  stuContentHistory: (label: string) => string;
  stuUntitled: string;
  stuDeleteDraft: string;
  stuModeAssisted: string;
  stuModeAssistedSub: string;
  stuModeIntel: string;
  stuModeIntelSub: string;
  stuYourIdea: string;
  stuIdeaPlaceholder: string;
  stuSignalsLabel: string;
  stuNoSignals: string;
  stuNoneSelected: string;
  stuSignalsSelected: (n: number) => string;
  stuGoalLabel: string;
  stuOptional: string;
  stuGoalPlaceholder: string;
  stuFormatLabel: string;
  stuFormatPost: string;
  stuFormatPostDesc: string;
  stuFormatImage: string;
  stuFormatImageDesc: string;
  stuFormatVideo: string;
  stuFormatVideoDesc: string;
  stuDurationLabel: string;
  stuDuration1Min: string;
  stuOrientationLabel: string;
  stuOrientPortrait: string;
  stuOrientLandscape: string;
  stuOrientAuto: string;
  stuOrientAdaptive: string;
  stuGenerateButton: string;
  stuApprox30s: string;
  stuReadyTitle: string;
  stuReadyDesc: (label: string) => string;
  stuComposing: string;
  stuLoadSteps: string[];
  stuLiveSignalsEyebrow: string;
  stuIdeasToExpand: string;
  stuLiveSignalFallback: string;
  stuContentTitle: string;
  stuViralHookLabel: string;
  stuModify: string;
  stuSave: string;
  stuCancel: string;
  stuOpening: string;
  stuOpen: string;
  stuCopied: string;
  stuCopy: string;
  stuContentScript: string;
  stuScriptPlaceholder: string;
  stuHashtags: string;
  stuHashtagsPlaceholder: string;
  stuVisualPrompt: string;
  stuGenerateImage: string;
  stuGeneratingVisual: string;
  stuImageFailed: string;
  stuRetry: string;
  stuDownload: string;
  stuRegenerate: string;
  stuPostOn: string;
  stuConnected: string;
  stuConnectArrow: string;
  stuCaptionLinked: (labels: string) => string;
  stuPostNow: string;
  stuSavedExcl: string;
  stuSaving: string;
  stuSchedulePost: string;
  stuPostScheduled: string;
  stuScheduleHeader: string;
  stuDate: string;
  stuTime: string;
  stuConfirmSchedule: string;
  stuScheduling: string;
  // Profile
  profLoadingDossier: string;
  profUnnamedOperator: string;
  profModeBadge: (label: string) => string;
  profMyMission: string;
  profMissionPlaceholder: string;
  profEditIdentity: string;
  profUnlockDossier: string;
  profAurumScore: string;
  profReadinessIndex: string;
  profMomentum: string;
  profDayStreak: string;
  profPhase: string;
  profOnboarding: string;
  profToNextPhase: (pct: number) => string;
  profScoreBreakdownEyebrow: string;
  profScoreBreakdownTitle: string;
  profKnowledge: string;
  profKnowledgeHint: string;
  profNetwork: string;
  profNetworkHint: string;
  profVisibility: string;
  profVisibilityHint: string;
  profExecution: string;
  profExecutionHint: string;
  profIdentity: string;
  profIdentityHint: string;
  profConnectedAccountsEyebrow: string;
  profConnectedAccountsTitle: string;
  profConnectDesc: string;
  profConnected: string;
  profNotConnected: string;
  profDisconnect: string;
  profConnect: string;
  profEditIdentityTitle: string;
  profEditIdentityDesc: string;
  profFieldFullName: string;
  profFieldProfession: string;
  profFieldLocation: string;
  profFieldMission: string;
  profFieldGoal: string;
  profFieldPhotoUrl: string;
  profFieldLinkedinUrl: string;
  profFieldInstagramUrl: string;
  profPlaceholderProfession: string;
  profPlaceholderMission: string;
  profPlaceholderGoal: string;
  profCancel: string;
  profSave: string;
  profConnectPlatform: (name: string) => string;
  profConnectHintSuffix: string;
  profPlatformLinkedinLabel: string;
  profPlatformLinkedinHint: string;
  profPlatformUsernameLabel: string;
  profPlatformInstagramHint: string;
  profPlatformTwitterHint: string;
  profPlatformTiktokHint: string;
  profPlatformYoutubeLabel: string;
  profPlatformYoutubeHint: string;
  profPlatformSubstackLabel: string;
  profPlatformSubstackHint: string;
  profConnecting: string;
  // Settings
  setPreferencesEyebrow: string;
  setTuneTitle: string;
  setSectionAccount: string;
  setSectionAurum: string;
  setSectionContent: string;
  setSectionNotifications: string;
  setSectionPrivacy: string;
  setSectionBilling: string;
  setSectionDanger: string;
  setSoon: string;
  setAccountTitle: string;
  setAccountDesc: string;
  setFieldFullName: string;
  setFullNamePlaceholder: string;
  setFieldEmail: string;
  setEmailPlaceholder: string;
  setEmailChangeHint: string;
  setSaveChanges: string;
  setFieldPassword: string;
  setPasswordResetDesc: string;
  setSendPasswordReset: string;
  setEmailChangeToast: string;
  setAccountUpdatedToast: string;
  setSaveFailedToast: string;
  setPasswordResetSentToast: string;
  setAurumTitle: string;
  setAurumDesc: string;
  setActiveMode: string;
  setModeSwitchedToast: (label: string) => string;
  setExperienceLevel: string;
  setLevelBeginner: string;
  setLevelBeginnerDesc: string;
  setLevelIntermediate: string;
  setLevelIntermediateDesc: string;
  setLevelExperienced: string;
  setLevelExperiencedDesc: string;
  setLevelUpdatedToast: string;
  setMyGoal: string;
  setGoalPlaceholder: string;
  setGoalSavedToast: string;
  setGoalHint: string;
  setDailyRitualIntensity: string;
  setTasksLabel: (n: number) => string;
  setDailyTasksToast: (n: number) => string;
  setMentorTone: string;
  setToneStrategic: string;
  setToneStrategicDesc: string;
  setToneWarm: string;
  setToneWarmDesc: string;
  setToneSocratic: string;
  setToneSocraticDesc: string;
  setMentorToneToast: string;
  setAiResponseStyle: string;
  setStyleConcise: string;
  setStyleConciseDesc: string;
  setStyleDetailed: string;
  setStyleDetailedDesc: string;
  setAiStyleToast: string;
  setResetOnboarding: string;
  setResetOnboardingDesc: string;
  setRedoOnboarding: string;
  setContentTitle: string;
  setContentDesc: string;
  setPreferredPlatforms: string;
  setPlatformAll: string;
  setPlatformLinkedinOnly: string;
  setPlatformInstagramOnly: string;
  setPlatformLinkedinInstagram: string;
  setPlatformsUpdatedToast: string;
  setContentTone: string;
  setToneProfessional: string;
  setToneConversational: string;
  setToneBold: string;
  setContentToneUpdatedToast: string;
  setAutoGenerateDailyBrief: string;
  setDailyBrief: string;
  setDailyBriefDesc: string;
  setDailyBriefEnabledToast: string;
  setDailyBriefDisabledToast: string;
  setNotificationsTitle: string;
  setNotificationsDesc: string;
  setNotifStreakLabel: string;
  setNotifStreakDesc: string;
  setNotifAcademyLabel: string;
  setNotifAcademyDesc: string;
  setNotifIntelligenceLabel: string;
  setNotifIntelligenceDesc: string;
  setNotifMentorLabel: string;
  setNotifMentorDesc: string;
  setNotifSystemLabel: string;
  setNotifSystemDesc: string;
  setRecent: string;
  setMarkAllRead: string;
  setNoNotifications: string;
  setTimeJustNow: string;
  setTimeMinAgo: (m: number) => string;
  setTimeHourAgo: (h: number) => string;
  setTimeDayAgo: (d: number) => string;
  setPrivacyTitle: string;
  setPrivacyDesc: string;
  setLegalTitle: string;
  setViewTerms: string;
  setViewPrivacyPolicy: string;
  setExportDataTitle: string;
  setExportDataDesc: string;
  setExportDataButton: string;
  setExportDataSuccessToast: string;
  setExportDataFailedToast: string;
  setDeleteAccountTitle: string;
  setDeleteAccountDesc: string;
  setDeleteAccountButton: string;
  setDeleteAccountWarning: string;
  setDeleteAccountTypePlaceholder: string;
  setDeleteAccountConfirm: string;
  setDeleteAccountFailedToast: string;
  setCancel: string;
  setBillingTitle: string;
  setBillingDesc: string;
  setCurrentPlan: string;
  setPlanFree: string;
  setPlanPro: string;
  setManageBilling: string;
  setUpgradeToPro: string;
  setBillingPortalFailedToast: string;
  setPastDueWarning: string;
  setTrialingNote: string;
  setCanceledNote: string;
  setAccessUntil: (date: string) => string;
  setRenewsOn: (date: string) => string;
  setFreeUsageTitle: string;
  setUsageStudioDrafts: string;
  setUsageNetworkDrafts: string;
  setUsageMentorMessages: string;
  setUsageTutorMessages: string;
  setUsageRoadmapHelp: string;
  setDangerTitle: string;
  setDangerDesc: string;
  setSignOut: string;
  setSignOutDesc: string;
  setSignOutAll: string;
  setSignOutAllDesc: string;
  // Page intro overlays — one-time (until dismissed) welcome/guide splash per page
  introEyebrow: string;
  introEnterCta: string;
  introDontShowAgain: string;
  introDashboardDesc: string;
  introDashboardFeatures: string[];
  introRoadmapDesc: string;
  introRoadmapFeatures: string[];
  introIntelligenceDesc: string;
  introIntelligenceFeatures: string[];
  introMentorDesc: string;
  introMentorFeatures: string[];
  introAcademyDesc: string;
  introAcademyFeatures: string[];
  introTutorDesc: string;
  introTutorFeatures: string[];
  introStudioDesc: string;
  introStudioFeatures: string[];
  introCalendarDesc: string;
  introCalendarFeatures: string[];
  introNetworkDesc: string;
  introNetworkFeatures: string[];
  introProfileDesc: string;
  introProfileFeatures: string[];
  // Milestone celebrations (streak thresholds, module/phase/track completion)
  celebrationStreakTitle: (n: number) => string;
  celebrationStreakSubtitle: string;
  celebrationModuleTitle: string;
  celebrationPhaseTitle: (phase: string) => string;
  celebrationTrackTitle: (trackName: string) => string;
  celebrationTrackSubtitle: string;
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
    navCalendar: "Calendar",
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
    proFeatureLabel: "Pro Feature",
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
    // Dashboard
    dashDemoMode: "Demo mode",
    dashDemoMessage: "Sign in to unlock the full experience — memory, persistence, unlimited AI.",
    dashSignIn: "Sign in",
    dashFreePlan: "Free plan",
    dashUpgradeMessage: "Upgrade to Pro — unlock your 30-day Roadmap, AI Tutor, full Academy & unlimited mentor.",
    dashUpgradeCta: "Upgrade · £29/mo",
    greeting: (period) => period === "morning" ? "Good morning" : period === "afternoon" ? "Good afternoon" : "Good evening",
    dashSpeakWithAurum: "Speak with AURUM",
    dashOpenIntelligence: "Open Intelligence",
    dashTodayEyebrow: (mode) => `TODAY · ${mode.toUpperCase()}`,
    dashDailyRitual: "Daily ritual",
    dashOfCount: (completed, total) => `${completed} of ${total}`,
    dashAllComplete: "ALL COMPLETE",
    dashAcademyEyebrow: "ACADEMY",
    dashYourTracks: "Your tracks",
    dashComingSoon: "Coming soon",
    dashTrackComplete: (done, total) => `${done}/${total} complete`,
    dashMomentumLabel: (pct) => `Momentum · ${pct}%`,
    dashAllIndustries: "All industries",
    dashSelectEvent: "Select an event",
    dashSelectEventDesc: "Click any event on the calendar to see details, content prep timing and create posts.",
    dashDaysAway: (n) => `${n} day${n === 1 ? "" : "s"} away`,
    dashHappeningToday: "Happening today",
    dashEventPassed: "Event has passed",
    dashContentPrepWindow: "CONTENT PREP WINDOW",
    dashStartPosting: (weeks) => `Start posting ${weeks} week${weeks === 1 ? "" : "s"} before the event.`,
    dashContentWindowOpensIn: (days, date) => `Content window opens in ${days} day${days === 1 ? "" : "s"} — ${date}`,
    dashContentWindowOpenNow: "Content window is open right now. Start posting today.",
    dashEventHasPassed: "This event has passed.",
    dashCreateContentForEvent: "Create content for this event",
    dashVisitOfficialSite: "Visit official site",
    dashWelcomes: [
      "Today is a quiet step toward an extraordinary life.",
      "The world rewards those who show up with intention. Begin.",
      "Elite operators do today what others postpone. Move first.",
      "A single conversation today can reshape your next decade.",
      "Refinement is built in silence, before the world notices.",
      "Your network is watching. Give them something worth remembering.",
      "Discipline is the architecture of luxury. Build deliberately.",
      "Make today undeniable — in craft, in presence, in execution.",
    ],
    dashCompletionMessages: [
      "🎉 Excellent work! You've completed all 5 daily rituals today. Keep building momentum and come back tomorrow for another step forward.",
      "🏆 Daily mission accomplished! Every ritual completed. Rest, recharge, and come back tomorrow to continue your streak.",
      "✨ Great job! You've shown up for yourself and completed everything today. Come back tomorrow and do it again.",
      "🔥 You're on fire! All 5 rituals are complete. Small daily actions create big results — see you tomorrow.",
      "💪 Another day, another victory. You've completed every ritual. Come back tomorrow and keep the momentum going.",
      "🌟 Outstanding! Consistency is your superpower. All tasks completed — come back tomorrow for the next challenge.",
      "🚀 Progress unlocked! You've completed today's rituals and moved one step closer to your goals. Come back tomorrow.",
      "👏 Well done! Today's work is finished. Keep stacking these wins and return tomorrow for another successful day.",
      "🎯 Target hit! All 5 rituals completed successfully. Take pride in today's effort and come back tomorrow.",
      "⚡ Momentum builds one day at a time. You've completed every ritual today. Come back tomorrow and keep growing.",
      "🏅 Success! You've finished all of today's rituals. The journey continues — come back tomorrow.",
      "🌱 Growth happens daily, and today you've done your part. All rituals complete. Come back tomorrow and keep evolving.",
      "💎 Discipline achieved. Every ritual completed. Your future self will thank you — come back tomorrow.",
      "🎖️ Another perfect day. All 5 rituals are complete. Keep the streak alive and come back tomorrow.",
      "🔥 Streak secured! You've completed everything on today's list. See you tomorrow for the next round.",
      "🌄 A productive day comes to a close. Every ritual is complete. Rest well and come back tomorrow.",
      "⭐ Fantastic work! You've earned today's victory. Come back tomorrow and continue building something great.",
      "🛡️ You kept your commitment to yourself today. All rituals complete. Come back tomorrow and do it again.",
      "📈 Progress never stops. You've completed all 5 rituals today. Come back tomorrow for another step upward.",
      "👑 Congratulations! Today's rituals are complete. Stay consistent, stay focused, and come back tomorrow for the next level.",
      "✅ Daily ritual complete. Five tasks finished, one step closer to the life you're building. Come back tomorrow.",
      "🌟 You've done the work today. Your future self is already benefiting. Come back tomorrow and keep going.",
      "🏆 Another successful day in the books. All five rituals completed. Come back tomorrow for your next win.",
      "🔥 Consistency beats motivation. You've completed all five rituals today. Come back tomorrow and continue the streak.",
      "⚡ Progress confirmed. Every ritual is complete. Rest well and return tomorrow stronger than before.",
      "🎯 Mission accomplished. Today's rituals are complete. Tomorrow is another opportunity to level up.",
      "🚀 Momentum is growing. Five rituals complete. Come back tomorrow and keep moving forward.",
      "💪 Discipline wins again. Every task completed. Come back tomorrow and build on today's success.",
      "🌱 Small actions. Big future. All rituals complete. Come back tomorrow and plant another seed.",
      "🏅 You kept your promise to yourself today. Five rituals complete. Come back tomorrow and do it again.",
      "⭐ Another brick added to the foundation. All five rituals completed. Come back tomorrow to keep building.",
      "🔥 Streak protected. Progress secured. Come back tomorrow and continue your journey.",
      "💎 Excellence is built daily. Today's rituals are complete. Come back tomorrow for another step forward.",
      "🎖️ You've earned today's victory. All five rituals are done. Come back tomorrow for the next challenge.",
      "⚔️ The battle for your goals continues. Today's round is won. Come back tomorrow.",
      "🌄 Day complete. Rituals complete. Progress complete. Come back tomorrow and keep climbing.",
      "🚩 Checkpoint reached. All five rituals completed successfully. Come back tomorrow and continue the adventure.",
      "📈 Growth recorded. Every ritual finished. Come back tomorrow and keep raising the standard.",
      "🏔️ Great achievements are built one day at a time. Today's work is done. Come back tomorrow.",
      "👑 Another day conquered. Five rituals complete. Return tomorrow and continue your ascent.",
    ],
    monthShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    weekdayLetters: ["M","T","W","T","F","S","S"],
    // Calendar
    calEyebrow: "YOUR PROGRESS, MAPPED",
    calHeroPre: "Every day you",
    calHeroEm: "show up",
    calSubtitle: "A living record of your daily rituals and a place to plan what's next — completions, streaks, and tasks with reminders, all in one grid.",
    calAddTask: "Add task",
    calToday: "Today",
    calRitualLabel: "Daily ritual",
    calRoadmapLabel: "Roadmap",
    calLegendDue: "Task due",
    calLegendOverdue: "Overdue",
    calLegendEvent: "Community event",
    calNoActivity: "No activity this day",
    calDayTasksDone: (n) => `${n} task${n === 1 ? "" : "s"} completed`,
    calDueToday: "Due today",
    calOverdue: "Overdue",
    calUpcoming: "Upcoming",
    calModalTitle: "New task",
    calModalTitleLabel: "Title",
    calModalTitlePlaceholder: "e.g. Follow up with the broker",
    calModalDescLabel: "Notes",
    calModalDescPlaceholder: "Optional detail…",
    calModalDueLabel: "Due date",
    calModalReminderLabel: "Remind me",
    calModalReminderHint: "We'll email you at this time if the task isn't done yet.",
    calModalPriorityLabel: "Priority",
    calPriorityLow: "Low",
    calPriorityMedium: "Medium",
    calPriorityHigh: "High",
    calModalSave: "Save task",
    calModalSaving: "Saving…",
    calModalCancel: "Cancel",
    calDeleteTask: "Delete",
    calMarkDone: "Mark done",
    calMarkUndone: "Mark not done",
    calEmptyDay: "Nothing planned for this day yet.",
    calSelectDayHint: "Select a day to see what happened — or plan what's next.",
    calStreakLabel: (n) => `${n}-day streak`,
    calMonthCompletion: (pct) => `${pct}% of days active this month`,
    calReminderSet: "Reminder set",
    calReminderBadge: "Reminder",
    calDragToReschedule: "Drag onto a day to reschedule",
    // Calendar — Community events
    calCommunityTitle: "Community Events",
    calCommunityDesc: "Events shared by others building in this industry.",
    calShareEvent: "Share an event",
    calNoEvents: "No upcoming events",
    calNoEventsDesc: "Be the first to share an event with the community.",
    calLoadingEvents: "Loading events…",
    calEventModalTitle: "Share an event",
    calEventTitleLabel: "Event title",
    calEventTitlePlaceholder: "e.g. Monaco Yacht Show — meetup",
    calEventDescLabel: "Description",
    calEventDescPlaceholder: "What's happening, who should come…",
    calEventLocationLabel: "Location",
    calEventLocationPlaceholder: "e.g. Port Hercules, Monaco",
    calEventStartLabel: "Starts",
    calEventEndLabel: "Ends (optional)",
    calEventSave: "Share event",
    calEventSaving: "Sharing…",
    calRsvp: "RSVP",
    calRsvped: "Going",
    calAttendees: (n) => (n === 1 ? "1 going" : `${n} going`),
    calDeleteEvent: "Delete event",
    calOrganizedBy: (name) => `Hosted by ${name}`,
    // Roadmap
    roadmapEyebrow: (mode) => `ROADMAP · ${mode.toUpperCase()}`,
    roadmapBuilding: "Building your roadmap…",
    roadmapDefaultHeadline: "Your 30-Day Plan",
    roadmapDescription: "A personalized 30-day entry plan built around your industry, level, and goals. Specific daily actions — check them off as you go.",
    roadmapRegenerate: "Regenerate",
    roadmapGenerating: "Generating…",
    roadmapOverallProgress: "Overall progress",
    roadmapArchitecting: "Architecting your roadmap…",
    roadmapArchitectingDesc: (industry) => `AURUM is building 30 days of precision execution for ${industry}. This takes about 15 seconds.`,
    roadmapWeekLabel: (n) => `Week ${n} · `,
    roadmapWeekHeader: (n) => `WEEK ${n}`,
    roadmapMilestone: "MILESTONE",
    roadmapPrevWeek: "← Previous week",
    roadmapNextWeek: "Next week →",
    roadmapGetHelp: "Get help",
    roadmapHideHelp: "Hide help",
    roadmapHelpLoading: "Working out how to help…",
    roadmapHelpFailed: "Couldn't load help — try again.",
    roadmapSwapTask: "Swap task",
    roadmapSwapping: "Swapping…",
    roadmapSwapFailed: "Couldn't swap this task — try again.",
    roadmapContinueInMentor: "Continue in Mentor",
    roadmapHelpGateMessage: "You've used your free task help sessions. Upgrade to Pro for unlimited help on every task.",
    roadmapMarkComplete: "Mark complete",
    roadmapMarkIncomplete: "Mark incomplete",
    roadmapLockTitle: "Your 30-Day Roadmap",
    roadmapLockDesc: "A day-by-day execution plan built for your goal — four weeks of networking, content, and outreach tasks, mapped out and synced to your calendar.",
    roadmapLockFeatures: [
      "Full 30-day, week-by-week plan",
      "AI \"Get help\" guidance on every task",
      "Auto-synced to your Calendar",
      "Regenerate anytime as your goal evolves",
    ],
    typeNetworking: "Networking",
    typeContent: "Content",
    typeLearning: "Learning",
    typeOutreach: "Outreach",
    typeMindset: "Mindset",
    // Intelligence
    intelEyebrow: (mode, category) => `AURUM · ${mode.toUpperCase()} · ${category.toUpperCase()}`,
    intelHeadline: "The signal beneath the noise.",
    intelDescPre: "Real-time synthesis from the AURUM intelligence network — curated for ",
    intelYour: "your",
    intelDescPost: (industry) => ` position in the ${industry.toLowerCase()} market.`,
    intelLive: "LIVE",
    intelSync: (time) => `Sync ${time}`,
    intelSyncing: "Syncing…",
    intelJustNow: "just now",
    intelMinAgo: (n) => `${n}m ago`,
    intelHourAgo: (n) => `${n}h ago`,
    intelDayAgo: (n) => `${n}d ago`,
    intelSignalsTracked: "Signals tracked",
    intelSources: "Sources",
    intelRealtime: "Realtime",
    intelOn: "ON",
    intelLatest: "LATEST",
    intelSignalsOf: (category) => `Signals · ${category}`,
    intelReadBrief: "Read brief",
    intelGenerateContent: "Generate content",
    categoryLabel: (category) => ({ yachting: "Yachting", property: "Property", aviation: "Aviation", automotive: "Automotive" }[category] ?? category),
    // Mentor
    mentorMinAgo: (n) => `${n}m ago`,
    mentorHourAgo: (n) => `${n}h ago`,
    mentorYesterday: "Yesterday",
    mentorOpener: (greeting, userName, persona, industry) => `${greeting}, ${userName}. I am your AURUM ${persona} — here to help you break into ${industry.toLowerCase()} at the highest level. What is your most pressing challenge right now?`,
    mentorThinking: "AURUM is thinking...",
    mentorPlaceholder: (industry) => `Ask AURUM about ${industry.toLowerCase()} — strategy, outreach, the market...`,
    mentorFreeMessages: "free messages",
    mentorOnline: "ONLINE",
    mentorNewConversation: "New conversation",
    mentorRecentConversations: "RECENT CONVERSATIONS",
    mentorConvMeta: (date, n) => `${date} · ${n} message${n === 1 ? "" : "s"}`,
    mentorDeleteConversation: "Delete conversation",
    mentorQuickInvocations: "QUICK INVOCATIONS",
    mentorContextLoaded: "CONTEXT LOADED",
    mentorExecutionStreak: (n) => `${n}-day execution streak`,
    mentorTasksCompletedToday: (n) => `${n} tasks completed today`,
    mentorGateMessage: "You've used your 5 free mentor messages. Upgrade to Pro for unlimited access.",
    mentorGateMessageModal: "You've used your 5 free mentor messages. Upgrade to Pro for unlimited AI mentorship.",
    mentorErrorPrefix: "Error: ",
    mentorContent: (industryId) => ({
      yachts: {
        persona: "AURUM · Yachting Counsel",
        specialty: "Brokerage, charter, owner psychology · Monaco-rooted",
        prompts: [
          "Plan my Monaco Yacht Show week",
          "Review my brokerage LinkedIn positioning",
          "Draft a charter inquiry to a UHNW prospect",
          "Coach me through a senior broker conversation",
        ],
      },
      villas: {
        persona: "AURUM · Ultra-Prime Counsel",
        specialty: "Trophy real estate, UHNW investors, developers · Dubai/Miami/Monaco",
        prompts: [
          "Plan my Dubai trophy market week",
          "Review my luxury real estate positioning",
          "Draft outreach to a UHNW investor",
          "Coach me through a developer pitch",
        ],
      },
      jets: {
        persona: "AURUM · Aviation Counsel",
        specialty: "Aircraft brokerage, charter, fractional, UHNW travel",
        prompts: [
          "Plan my EBACE / NBAA week",
          "Review my aviation LinkedIn positioning",
          "Draft outreach to a Global 7500 owner",
          "Coach me through a charter pricing call",
        ],
      },
      cars: {
        persona: "AURUM · Collector Counsel",
        specialty: "Hypercars, collector auctions, dealer relationships, allocation politics",
        prompts: [
          "Plan my Monterey Car Week",
          "Review my collector LinkedIn positioning",
          "Draft outreach to a hypercar allocation contact",
          "Coach me through a private-treaty negotiation",
        ],
      },
    })[industryId],
    // Academy
    acadEyebrow: (mode) => `ACADEMY · ${mode}`,
    acadHeroPre: "Become an insider —",
    acadHeroEm: "methodically.",
    acadTracks: "TRACKS",
    acadIndustryCurricula: "Industry curricula",
    acadModules: (n) => `${n} modules`,
    acadComingSoon: "Coming soon",
    acadComplete: (done, total) => `${done}/${total} complete`,
    acadComingSoonTitle: (trackName) => `${trackName} — Coming Soon`,
    acadComingSoonDesc: "This curriculum is being crafted by industry insiders. Switch to the Yacht Brokerage track to start learning now.",
    acadAiTutorTitle: "AI tutor for this module",
    acadBeginRolePlay: "Begin role-play →",
    acadCourseComingSoon: "Course coming soon",
    acadCourseComingSoonDesc: "This curriculum is being built. Switch to Yacht Brokerage to start learning now.",
    acadAdminViewNotice: "⚠ Admin view — this track is locked for users. Add content and quizzes here to prepare for launch.",
    acadActiveTrack: (track) => `ACTIVE TRACK · ${track}`,
    acadYachtBrokerage: "YACHT BROKERAGE",
    acadYourProgramme: "Your 10-module programme",
    acadOfTenComplete: (n) => `${n}/10 complete`,
    acadAdmin: "Admin",
    acadPhase: (num, title) => `Phase ${num} — ${title}`,
    acadVideoAvailable: "Video available",
    acadNoVideoYet: "No video yet",
    acadStart: "Start",
    acadBackToModules: "Back to modules",
    acadModuleOf: (num, phase) => `MODULE ${num} · PHASE ${phase}`,
    acadCompleted: "COMPLETED",
    acadClose: "Close",
    acadEdit: "Edit",
    acadMarkWatched: "Mark video as watched",
    acadVideoComingSoon: "Video content coming soon",
    acadAddVideoUrlHint: "Add a video URL in edit mode above",
    acadDownloads: "DOWNLOADS",
    acadModuleQuiz: "MODULE QUIZ",
    acadQuizPassed: "Quiz passed",
    acadScoreNextUnlocked: (score) => `Score: ${score}/5 · Next module unlocked`,
    acadAddQuestionsHint: "Add 5 questions in edit mode to enable the quiz.",
    acadQuizComingSoon: "Quiz coming soon.",
    acadQuizInstructions: "5 questions · Score 3/5 or higher to unlock the next module",
    acadLastScore: (score, attempts) => `Last score: ${score}/5 · Attempts: ${attempts}`,
    acadRetryQuiz: "Retry quiz",
    acadTakeQuiz: "Take quiz",
    acadBackToModule: "Back to module",
    acadQuizModule: (num) => `QUIZ · MODULE ${num}`,
    acadAnswerAll: "Answer all 5 questions · Score 3/5 or higher to pass.",
    acadModuleComplete: "Module Complete!",
    acadScoredUnlocked: (score) => `You scored ${score}/5 — next module is now unlocked.`,
    acadContinue: "Continue →",
    acadNotQuite: "Not quite",
    acadScoredRetry: (score, pass) => `You scored ${score}/5 — you need ${pass} correct to pass. Review the module and try again.`,
    acadTryAgain: "Try again",
    acadSubmitAnswers: "Submit answers",
    acadSubmitting: "Submitting…",
    acadSubmitFailed: "Couldn't submit your answers — check your connection and try again.",
    acadPhaseTitle: (_phaseNumber, fallback) => fallback,
    acadModuleTitle: (_track, _moduleNumber, fallback) => fallback,
    acadTutorBlurb: (industryId) => ({
      yachts: "Drill 'restraint as leverage' through a live role-play with AURUM — playing the part of a skeptical 80m-yacht owner.",
      villas: "Role-play sourcing a pocket-listing for an UHNW principal — AURUM plays the part of a discreet Monaco seller's broker.",
      jets: "Role-play a buyer call for a Global 7500 mandate — AURUM plays a skeptical principal weighing whole vs program.",
      cars: "Role-play building your collector narrative for a Pagani Utopia allocation — AURUM plays Lorenzo's client-relations lead.",
    })[industryId],
    // Tutor
    tutTitle: "AURUM AI Tutor",
    tutSubtitle: (trackName) => `${trackName} · step-by-step learning`,
    tutOnline: "ONLINE",
    tutComposing: "Tutor is composing...",
    tutPlaceholder: (industryId) => ({
      yachts: "Ask the tutor to explain a yachts concept...",
      villas: "Ask the tutor to explain a villas concept...",
      jets: "Ask the tutor to explain a jets concept...",
      cars: "Ask the tutor to explain a cars concept...",
    })[industryId],
    tutNewLesson: "New lesson",
    tutRecentLessons: "RECENT LESSONS",
    tutDeleteLesson: "Delete lesson",
    tutMessagesCount: (n) => `${n} messages`,
    tutMinsAgo: (n) => `${n}m ago`,
    tutHoursAgo: (n) => `${n}h ago`,
    tutYesterday: "Yesterday",
    tutLessonStarters: "LESSON STARTERS",
    tutActiveTrackLabel: "ACTIVE TRACK",
    tutModulesComplete: (done, total) => `${done}/${total} modules complete`,
    tutModeLine: (mode) => `Mode · ${mode}`,
    tutPhaseLine: (phase) => `Phase · ${phase}`,
    tutOpener: (trackName) =>
      `Welcome to the ${trackName} track. I am your AI Tutor — ask me to explain any module, term, or concept and I will break it down step-by-step. Where would you like to start?`,
    tutSuggestions: (industryId) => ({
      yachts: [
        "Explain the fundamentals of the yachts charter market",
        "Walk me through module 1 of the Yacht Brokerage step-by-step",
        "What insider terminology should I master first?",
        "Quiz me on a key concept from this track",
      ],
      villas: [
        "Explain the fundamentals of the villas prime market",
        "Walk me through module 1 of the Ultra-Prime Real Estate step-by-step",
        "What insider terminology should I master first?",
        "Quiz me on a key concept from this track",
      ],
      jets: [
        "Explain the fundamentals of the jets pre-owned market",
        "Walk me through module 1 of the Private Aviation step-by-step",
        "What insider terminology should I master first?",
        "Quiz me on a key concept from this track",
      ],
      cars: [
        "Explain the fundamentals of the cars collector market",
        "Walk me through module 1 of the Exotic Automotive step-by-step",
        "What insider terminology should I master first?",
        "Quiz me on a key concept from this track",
      ],
    })[industryId],
    tutGateMessage: "You've used your 5 free tutor messages. Upgrade to Pro for unlimited AI tutoring.",
    tutLockTitle: "AI Tutor",
    tutLockDesc: "Step-by-step lessons matched to your exact curriculum, with unlimited follow-up questions whenever you're stuck.",
    tutLockFeatures: [
      "Unlimited tutor conversations",
      "Structured, curriculum-matched lessons",
      "Saved lesson history",
      "Personalized to your track & industry",
    ],
    // Network
    netEyebrow: (mode) => `NETWORK · ${mode}`,
    netHeroPre: "The room you're",
    netHeroEm: "already in.",
    netSubtitle: "Manage your contacts, draft tailored outreach for every category, and track every message sent.",
    netTabContacts: (n) => `Contacts (${n})`,
    netTabDrafts: (n) => `Drafts (${n})`,
    netTabCompose: "Compose",
    netYourNetwork: "YOUR NETWORK",
    netContacts: "Contacts",
    netAddContact: "Add contact",
    netNewContact: "New contact",
    netNotesPlaceholder: "Notes…",
    netCancel: "Cancel",
    netSaveContact: "Save contact",
    netLoadingContacts: "Loading contacts…",
    netNoContacts: "No contacts yet",
    netNoContactsDesc: "Add your first contact to start drafting tailored outreach.",
    netDraftMessage: "Draft message",
    netOutreach: "OUTREACH",
    netDraftAMessage: "Draft a message",
    netTo: "TO",
    netAddContactFirst: "Add a contact first →",
    netPlatform: "PLATFORM",
    netRoleCategory: "THEIR ROLE / CATEGORY",
    netCategories: (industryId) => ({
      yachts: ["Charter Broker", "Sales Broker", "Captain / Crew", "Shipyard", "Marina", "Charter Management", "Insurance", "Survey / Refit"],
      villas: ["Developer", "Prime Agent", "Property Manager", "Interior Designer", "Insurance", "Legal / Tax", "Private Bank"],
      jets: ["Broker", "Charter Operator", "Maintenance (MRO)", "FBO", "Insurance", "Family Office", "Management Co."],
      cars: ["Dealer", "Auction House", "Collector", "Specialist / Restorer", "Insurance", "Transport", "Concours Organiser"],
    })[industryId],
    netDefaultCategories: ["Management", "Broker", "Insurance", "Agency", "Owner", "Investor", "Media"],
    netSubject: "SUBJECT",
    netSubjectPlaceholder: "Introduction — Your Name",
    netSelectContactHint: "↑ Select a contact above to generate a tailored message",
    netSelectContactFirstError: "Select a contact first.",
    netDraftFailed: "Draft generation failed. Try again.",
    netGateMessage: "You've used your 2 free message drafts. Upgrade to Pro for unlimited outreach.",
    netDrafting: "Drafting…",
    netDraftMessageTo: (name) => `Draft message to ${name}`,
    netSelectContactFirstBtn: "Select a contact first",
    netMessage: "MESSAGE",
    netMessagePlaceholder: "Your message will appear here after generation, or type directly…",
    netCopied: "Copied",
    netCopy: "Copy",
    netSaveDraft: "Save draft",
    netSend: "Send",
    netHistory: "HISTORY",
    netDraftsTitle: "Drafts",
    netLoading: "Loading…",
    netNoMessages: "No messages yet",
    netNoMessagesDesc: "Draft and send messages from the Compose tab.",
    netStatusSent: "sent",
    netStatusDraft: "draft",
    netJustNow: "Just now",
    netHoursAgo: (h) => `${h}h ago`,
    netYesterday: "Yesterday",
    netModifyDraft: "Modify draft",
    netDeleteDraft: "Delete draft",
    netRe: (subject) => `Re: ${subject}`,
    // Network — Community board
    comTab: "Community",
    comSectionEyebrow: "DISCUSSION",
    comBoardTitle: "Community Board",
    comBoardDesc: "Ask questions, share knowledge, and connect with others building in this industry.",
    comNewPost: "New post",
    comPostTitlePlaceholder: "Give it a clear headline…",
    comPostBodyPlaceholder: "Share knowledge, ask a question, start a discussion…",
    comPublish: "Publish",
    comPosting: "Publishing…",
    comPostFailed: "Couldn't publish your post. Try again.",
    comEmptyTitle: "No posts yet",
    comEmptyDesc: "Be the first to start a discussion in this industry.",
    comLoading: "Loading discussions…",
    comBack: "Back to board",
    comRepliesCount: (n) => (n === 1 ? "1 reply" : `${n} replies`),
    comReplyPlaceholder: "Add to the discussion…",
    comReplyButton: "Reply",
    comReplyingBtn: "Posting…",
    comReplyFailed: "Couldn't post your reply. Try again.",
    comNoReplies: "No replies yet",
    comNoRepliesDesc: "Be the first to respond.",
    comDeletePost: "Delete post",
    comDeleteReply: "Delete reply",
    comReport: "Report",
    comReportTitle: "Report content",
    comReportReasonPlaceholder: "Optional — tell us what's wrong",
    comReportSubmit: "Submit report",
    comReportSuccess: "Reported. Thank you.",
    comReportFailed: "Couldn't submit report. Try again.",
    comMember: "Member",
    comYou: "You",
    comUpvote: "Upvote",
    // Studio
    stuGateMessage: "You've used your free content draft. Upgrade to Pro for unlimited generation.",
    stuUpgradeReason: "You've used your free content draft. Upgrade to Pro for unlimited AI content generation.",
    stuGenerationFailed: "Generation failed",
    stuEyebrow: (mode) => `Content Studio · ${mode}`,
    stuFreeDraftLabel: "free draft",
    stuHeroPre: "Viral content,",
    stuHeroEm: "on demand.",
    stuSubtitle: (label) => `AURUM's AI creative director crafts post-ready content for the ${label} world — hooks, captions, scripts, hashtags, visuals. Ready in under 30 seconds.`,
    stuTags: ["Viral hooks", "Platform captions", "Hashtags", "AI visuals"],
    stuHistory: (n) => `History (${n})`,
    stuContentHistory: (label) => `CONTENT HISTORY · ${label}`,
    stuUntitled: "Untitled",
    stuDeleteDraft: "Delete draft",
    stuModeAssisted: "AI Assisted",
    stuModeAssistedSub: "Write from your own idea",
    stuModeIntel: "Live Intel",
    stuModeIntelSub: "Amplify today's signals",
    stuYourIdea: "YOUR IDEA",
    stuIdeaPlaceholder: `e.g. "Why hybrid superyachts are the new status symbol in Monaco"`,
    stuSignalsLabel: "SIGNALS · pick what to amplify",
    stuNoSignals: "No live signals yet. Switch to AI Assisted to write from your own idea.",
    stuNoneSelected: "None selected → AURUM will scan today's top signals.",
    stuSignalsSelected: (n) => `${n} signal${n > 1 ? "s" : ""} selected.`,
    stuGoalLabel: "GOAL",
    stuOptional: "(optional)",
    stuGoalPlaceholder: "e.g. attract UHNW charter clients",
    stuFormatLabel: "FORMAT",
    stuFormatPost: "Post",
    stuFormatPostDesc: "Facebook · X · LinkedIn",
    stuFormatImage: "Image",
    stuFormatImageDesc: "TikTok · IG · YouTube",
    stuFormatVideo: "Video",
    stuFormatVideoDesc: "TikTok · IG · YouTube",
    stuDurationLabel: "DURATION",
    stuDuration1Min: "1 min",
    stuOrientationLabel: "ORIENTATION",
    stuOrientPortrait: "Portrait",
    stuOrientLandscape: "Landscape",
    stuOrientAuto: "Auto",
    stuOrientAdaptive: "Adaptive",
    stuGenerateButton: "Generate viral content",
    stuApprox30s: "~30s",
    stuReadyTitle: "Your content, ready in 30s",
    stuReadyDesc: (label) => `Hook · Captions · Script · Hashtags · Visual — all in one shot, tuned for ${label}.`,
    stuComposing: "Composing your content…",
    stuLoadSteps: [
      "Scanning today's signals...",
      "Drafting your hook...",
      "Writing platform captions...",
      "Polishing hashtags and visuals...",
    ],
    stuLiveSignalsEyebrow: "LIVE SIGNALS",
    stuIdeasToExpand: "Ideas to expand",
    stuLiveSignalFallback: "LIVE SIGNAL",
    stuContentTitle: "CONTENT TITLE",
    stuViralHookLabel: "Viral Hook · First 2 Seconds",
    stuModify: "Modify",
    stuSave: "Save",
    stuCancel: "Cancel",
    stuOpening: "Opening…",
    stuOpen: "Open",
    stuCopied: "Copied",
    stuCopy: "Copy",
    stuContentScript: "CONTENT SCRIPT",
    stuScriptPlaceholder: "One beat per line…",
    stuHashtags: "HASHTAGS",
    stuHashtagsPlaceholder: "#yacht #luxury …",
    stuVisualPrompt: "VISUAL PROMPT",
    stuGenerateImage: "Generate image",
    stuGeneratingVisual: "Generating your visual…",
    stuImageFailed: "Image generation failed. Try again.",
    stuRetry: "Retry",
    stuDownload: "Download",
    stuRegenerate: "Regenerate",
    stuPostOn: "POST YOUR CONTENT ON",
    stuConnected: "Connected",
    stuConnectArrow: "Connect →",
    stuCaptionLinked: (labels) => `Caption linked: ${labels}`,
    stuPostNow: "Post your content now",
    stuSavedExcl: "Saved!",
    stuSaving: "Saving…",
    stuSchedulePost: "Schedule post",
    stuPostScheduled: "Post scheduled successfully",
    stuScheduleHeader: "SCHEDULE POST",
    stuDate: "Date",
    stuTime: "Time",
    stuConfirmSchedule: "Confirm schedule",
    stuScheduling: "Scheduling…",
    profLoadingDossier: "Loading dossier…",
    profUnnamedOperator: "Unnamed Operator",
    profModeBadge: (label) => `${label} Mode`,
    profMyMission: "MY MISSION",
    profMissionPlaceholder: 'Add your mission — e.g. "Break into Monaco yacht brokerage by Q4"',
    profEditIdentity: "EDIT IDENTITY",
    profUnlockDossier: "Start by adding your name and mission to unlock your dossier.",
    profAurumScore: "AURUM SCORE",
    profReadinessIndex: "Your readiness index",
    profMomentum: "MOMENTUM",
    profDayStreak: "day streak",
    profPhase: "PHASE",
    profOnboarding: "Onboarding",
    profToNextPhase: (pct) => `${pct}% to next phase`,
    profScoreBreakdownEyebrow: "AURUM SCORE BREAKDOWN",
    profScoreBreakdownTitle: "What's building your score.",
    profKnowledge: "Knowledge",
    profKnowledgeHint: "Complete Academy modules",
    profNetwork: "Network",
    profNetworkHint: "Make connections and introductions",
    profVisibility: "Visibility",
    profVisibilityHint: "Publish content and insights",
    profExecution: "Execution",
    profExecutionHint: "Complete daily tasks",
    profIdentity: "Identity",
    profIdentityHint: "Complete your profile",
    profConnectedAccountsEyebrow: "CONNECTED ACCOUNTS",
    profConnectedAccountsTitle: "Your publishing network.",
    profConnectDesc: "Connect your accounts so AURUM can publish directly on your behalf.",
    profConnected: "CONNECTED",
    profNotConnected: "NOT CONNECTED",
    profDisconnect: "Disconnect",
    profConnect: "Connect",
    profEditIdentityTitle: "Edit identity",
    profEditIdentityDesc: "Your dossier shapes every recommendation AURUM makes.",
    profFieldFullName: "Full name",
    profFieldProfession: "Current profession",
    profFieldLocation: "Location",
    profFieldMission: "My mission",
    profFieldGoal: "Goal",
    profFieldPhotoUrl: "Photo URL",
    profFieldLinkedinUrl: "LinkedIn URL",
    profFieldInstagramUrl: "Instagram URL",
    profPlaceholderProfession: "Yacht brokerage analyst",
    profPlaceholderMission: "Break into Monaco yacht brokerage by Q4",
    profPlaceholderGoal: "Sign first brokerage mandate",
    profCancel: "Cancel",
    profSave: "Save",
    profConnectPlatform: (name) => `Connect ${name}`,
    profConnectHintSuffix: " — AURUM will use this to redirect your content to the right platform.",
    profPlatformLinkedinLabel: "PROFILE URL OR USERNAME",
    profPlatformLinkedinHint: "Your LinkedIn profile URL or username",
    profPlatformUsernameLabel: "USERNAME",
    profPlatformInstagramHint: "Your Instagram handle (without @)",
    profPlatformTwitterHint: "Your X / Twitter handle",
    profPlatformTiktokHint: "Your TikTok handle",
    profPlatformYoutubeLabel: "CHANNEL NAME OR URL",
    profPlatformYoutubeHint: "Your YouTube channel name or URL",
    profPlatformSubstackLabel: "SUBSTACK URL",
    profPlatformSubstackHint: "Your full Substack publication URL",
    profConnecting: "Connecting…",
    setPreferencesEyebrow: "PREFERENCES",
    setTuneTitle: "Tune your operating system",
    setSectionAccount: "Account",
    setSectionAurum: "My AURUM",
    setSectionContent: "Content",
    setSectionNotifications: "Notifications",
    setSectionPrivacy: "Privacy",
    setSectionBilling: "Billing",
    setSectionDanger: "Danger Zone",
    setSoon: "SOON",
    setAccountTitle: "Account",
    setAccountDesc: "Manage your personal information and login credentials.",
    setFieldFullName: "Full name",
    setFullNamePlaceholder: "Your name",
    setFieldEmail: "Email address",
    setEmailPlaceholder: "you@domain.com",
    setEmailChangeHint: "Changing your email requires confirmation from the new address.",
    setSaveChanges: "Save changes",
    setFieldPassword: "Password",
    setPasswordResetDesc: "We'll send a reset link to your email address.",
    setSendPasswordReset: "Send password reset email",
    setEmailChangeToast: "Check your new email to confirm the change.",
    setAccountUpdatedToast: "Account updated.",
    setSaveFailedToast: "Failed to save",
    setPasswordResetSentToast: "Password reset email sent. Check your inbox.",
    setAurumTitle: "My AURUM",
    setAurumDesc: "Personalise your AI mentor, daily rituals and operating system.",
    setActiveMode: "Active mode",
    setModeSwitchedToast: (label) => `Switched to ${label} mode`,
    setExperienceLevel: "Experience level",
    setLevelBeginner: "Beginner",
    setLevelBeginnerDesc: "Exploring, building foundation",
    setLevelIntermediate: "Intermediate",
    setLevelIntermediateDesc: "In the industry, accelerating",
    setLevelExperienced: "Experienced",
    setLevelExperiencedDesc: "Established, scaling reach",
    setLevelUpdatedToast: "Level updated",
    setMyGoal: "My goal",
    setGoalPlaceholder: "e.g. Sign first brokerage mandate by Q4",
    setGoalSavedToast: "Goal saved",
    setGoalHint: "Used by your AI mentor to personalise every recommendation.",
    setDailyRitualIntensity: "Daily ritual intensity",
    setTasksLabel: (n) => `${n} tasks`,
    setDailyTasksToast: (n) => `Daily tasks set to ${n}`,
    setMentorTone: "Mentor tone",
    setToneStrategic: "Strategic",
    setToneStrategicDesc: "Calm, direct, no fluff",
    setToneWarm: "Warm",
    setToneWarmDesc: "Encouraging and supportive",
    setToneSocratic: "Socratic",
    setToneSocraticDesc: "Challenges your thinking",
    setMentorToneToast: "Mentor tone updated",
    setAiResponseStyle: "AI response style",
    setStyleConcise: "Concise",
    setStyleConciseDesc: "Short, sharp answers",
    setStyleDetailed: "Detailed",
    setStyleDetailedDesc: "In-depth explanations",
    setAiStyleToast: "AI style updated",
    setResetOnboarding: "Reset onboarding",
    setResetOnboardingDesc: "Redo your setup to change your industry and goals from scratch.",
    setRedoOnboarding: "Redo onboarding",
    setContentTitle: "Content & Intelligence",
    setContentDesc: "Control how AURUM generates content for you.",
    setPreferredPlatforms: "Preferred platforms",
    setPlatformAll: "All platforms",
    setPlatformLinkedinOnly: "LinkedIn only",
    setPlatformInstagramOnly: "Instagram only",
    setPlatformLinkedinInstagram: "LinkedIn + Instagram",
    setPlatformsUpdatedToast: "Platforms updated",
    setContentTone: "Content tone",
    setToneProfessional: "Professional",
    setToneConversational: "Conversational",
    setToneBold: "Bold",
    setContentToneUpdatedToast: "Content tone updated",
    setAutoGenerateDailyBrief: "Auto-generate daily brief",
    setDailyBrief: "Daily brief",
    setDailyBriefDesc: "Automatically generate your brief each morning",
    setDailyBriefEnabledToast: "Daily brief enabled",
    setDailyBriefDisabledToast: "Daily brief disabled",
    setNotificationsTitle: "Notifications",
    setNotificationsDesc: "Choose what alerts you receive inside AURUM OS.",
    setNotifStreakLabel: "Streak reminders",
    setNotifStreakDesc: "Daily nudge to keep your momentum going",
    setNotifAcademyLabel: "Academy progress",
    setNotifAcademyDesc: "When a new module unlocks or you complete one",
    setNotifIntelligenceLabel: "Intelligence feed",
    setNotifIntelligenceDesc: "Fresh luxury industry news available",
    setNotifMentorLabel: "Mentor sessions",
    setNotifMentorDesc: "Reminders to check in with your AI mentor",
    setNotifSystemLabel: "System & announcements",
    setNotifSystemDesc: "Platform updates and important alerts",
    setRecent: "RECENT",
    setMarkAllRead: "Mark all read",
    setNoNotifications: "No notifications yet",
    setTimeJustNow: "just now",
    setTimeMinAgo: (m) => `${m}m ago`,
    setTimeHourAgo: (h) => `${h}h ago`,
    setTimeDayAgo: (d) => `${d}d ago`,
    setPrivacyTitle: "Privacy",
    setPrivacyDesc: "Your data, your legal agreements, and your right to leave.",
    setLegalTitle: "Legal",
    setViewTerms: "Terms of Service",
    setViewPrivacyPolicy: "Privacy Policy",
    setExportDataTitle: "Export your data",
    setExportDataDesc: "Download everything AURUM OS has on your account — profile, roadmap, content history, tasks and more — as a JSON file.",
    setExportDataButton: "Export my data",
    setExportDataSuccessToast: "Your data export has started downloading.",
    setExportDataFailedToast: "Couldn't export your data. Please try again.",
    setDeleteAccountTitle: "Delete account",
    setDeleteAccountDesc: "Permanently delete your account and all associated data. This cannot be undone.",
    setDeleteAccountButton: "Delete my account",
    setDeleteAccountWarning: "This permanently deletes your account, cancels any active subscription, and erases all your data — roadmap, content history, tasks, mentor conversations, everything. There is no undo. Type DELETE to confirm.",
    setDeleteAccountTypePlaceholder: "Type DELETE to confirm",
    setDeleteAccountConfirm: "Permanently delete my account",
    setDeleteAccountFailedToast: "Couldn't delete your account. Please try again or contact support.",
    setCancel: "Cancel",
    setBillingTitle: "Billing",
    setBillingDesc: "Manage your plan, payment method and invoice history.",
    setCurrentPlan: "Current plan",
    setPlanFree: "Free",
    setPlanPro: "Pro",
    setManageBilling: "Manage billing",
    setUpgradeToPro: "Upgrade to Pro — £29/month",
    setBillingPortalFailedToast: "Couldn't open the billing portal. Please try again.",
    setPastDueWarning: "Your last payment failed — update your payment method to keep Pro access.",
    setTrialingNote: "You're on a trial period.",
    setCanceledNote: "Your subscription has been canceled.",
    setAccessUntil: (date) => `Pro access until ${date}, then your account reverts to Free.`,
    setRenewsOn: (date) => `Renews on ${date}.`,
    setFreeUsageTitle: "Free plan usage",
    setUsageStudioDrafts: "Content Studio drafts",
    setUsageNetworkDrafts: "Network message drafts",
    setUsageMentorMessages: "Mentor messages",
    setUsageTutorMessages: "Tutor messages",
    setUsageRoadmapHelp: "Roadmap task help",
    setDangerTitle: "Danger Zone",
    setDangerDesc: "Irreversible actions. Proceed with caution.",
    setSignOut: "Sign out",
    setSignOutDesc: "Sign out of this device",
    setSignOutAll: "Sign out all",
    setSignOutAllDesc: "Sign out of all devices and sessions",
    // Page intro overlays
    introEyebrow: "GETTING STARTED",
    introEnterCta: "Enter",
    introDontShowAgain: "Don't show this again",
    introDashboardDesc: "Your daily home base — today's ritual, your active industry track, and the events shaping what to post next, all in one view.",
    introDashboardFeatures: [
      "Daily ritual with mode-specific tasks to check off",
      "Academy track progress at a glance",
      "Industry events with content-prep countdowns",
      "One-tap access to Mentor and Intelligence",
    ],
    introRoadmapDesc: "A personalized 30-day entry plan built around your industry, level, and goals — specific daily actions you check off as you go.",
    introRoadmapFeatures: [
      "Week-by-week plan tailored to your track and time budget",
      "Daily tasks generated for your exact situation",
      "Per-task AI help whenever you're stuck",
      "Progress carries straight into your daily ritual",
    ],
    introIntelligenceDesc: "The signal beneath the noise — a live feed of curated news and moves in your industry, refreshed continuously.",
    introIntelligenceFeatures: [
      "Real-time feed filtered to your industry",
      "One-tap \"generate content\" from any story",
      "Full briefs without leaving the page",
      "Categorized so you only see what's relevant",
    ],
    introMentorDesc: "An open conversation with AURUM about your career moves, decisions, and positioning — it remembers your context between sessions.",
    introMentorFeatures: [
      "Saved conversation history — pick up where you left off",
      "Understands your industry, level, and current focus",
      "Suggested prompts to get you unstuck",
      "Personalized to your execution streak and goals",
    ],
    introAcademyDesc: "Become an insider, methodically — structured modules that take you from outsider to fluent in your chosen industry.",
    introAcademyFeatures: [
      "Track-specific modules and lessons",
      "Role-play and applied exercises, not just reading",
      "Progress tracked module by module",
      "Built around real entry-level scenarios",
    ],
    introTutorDesc: "Step-by-step lessons matched to your exact curriculum, with follow-up questions whenever you're stuck.",
    introTutorFeatures: [
      "Curriculum-matched, structured explanations",
      "Unlimited follow-up questions",
      "Saved lesson history",
      "Personalized to your track and industry",
    ],
    introStudioDesc: "AURUM's AI creative director crafts post-ready content for your industry — hooks, captions, scripts, hashtags, and visuals in under 30 seconds.",
    introStudioFeatures: [
      "Platform-specific captions and hooks",
      "Full scripts with shot-by-shot beats",
      "Hashtag sets tuned to your industry",
      "Live signals to base content on what's trending now",
    ],
    introCalendarDesc: "A living record of your daily rituals and a place to plan what's next — completions, streaks, and tasks with reminders, all in one grid.",
    introCalendarFeatures: [
      "Visual streak and completion tracking",
      "Tasks with due dates and reminders",
      "Industry events layered on the same calendar",
      "Community events other members are sharing",
    ],
    introNetworkDesc: "The room you're already in — manage your contacts, draft tailored outreach for every category, and track every message sent.",
    introNetworkFeatures: [
      "Contact list organized by category",
      "AI-drafted, personalized outreach messages",
      "Sent-message tracking so nothing falls through",
      "Community board to connect with other members",
    ],
    introProfileDesc: "Your dossier — the profile AURUM uses to personalize every recommendation, plus your AURUM Score and connected accounts.",
    introProfileFeatures: [
      "Editable profile that shapes AI recommendations",
      "AURUM Score breakdown",
      "Connected social and platform accounts",
      "Your track record — streak, completions, and history",
    ],
    celebrationStreakTitle: (n) => `${n}-day streak`,
    celebrationStreakSubtitle: "Keep the momentum going.",
    celebrationModuleTitle: "Module complete",
    celebrationPhaseTitle: (phase) => `Phase complete — ${phase}`,
    celebrationTrackTitle: (trackName) => `${trackName} complete`,
    celebrationTrackSubtitle: "You've finished the entire curriculum.",
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
    navCalendar: "Calendrier",
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
    proFeatureLabel: "Fonctionnalité Pro",
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
    // Dashboard
    dashDemoMode: "Mode démo",
    dashDemoMessage: "Connectez-vous pour profiter de l'expérience complète — mémoire, sauvegarde, IA illimitée.",
    dashSignIn: "Se connecter",
    dashFreePlan: "Offre gratuite",
    dashUpgradeMessage: "Passez à Pro — débloquez votre feuille de route de 30 jours, le Tuteur IA, l'Académie complète et le mentor illimité.",
    dashUpgradeCta: "Passer Pro · 29 £/mois",
    greeting: (period) => period === "evening" ? "Bonsoir" : "Bonjour",
    dashSpeakWithAurum: "Parler à AURUM",
    dashOpenIntelligence: "Ouvrir Intelligence",
    dashTodayEyebrow: (mode) => `AUJOURD'HUI · ${mode.toUpperCase()}`,
    dashDailyRitual: "Rituel quotidien",
    dashOfCount: (completed, total) => `${completed} sur ${total}`,
    dashAllComplete: "TOUT EST FAIT",
    dashAcademyEyebrow: "ACADÉMIE",
    dashYourTracks: "Vos parcours",
    dashComingSoon: "Bientôt disponible",
    dashTrackComplete: (done, total) => `${done}/${total} terminé`,
    dashMomentumLabel: (pct) => `Élan · ${pct}%`,
    dashAllIndustries: "Tous les secteurs",
    dashSelectEvent: "Sélectionnez un événement",
    dashSelectEventDesc: "Cliquez sur un événement du calendrier pour voir les détails, la fenêtre de préparation et créer des publications.",
    dashDaysAway: (n) => n === 1 ? "Dans 1 jour" : `Dans ${n} jours`,
    dashHappeningToday: "C'est aujourd'hui",
    dashEventPassed: "Cet événement est passé",
    dashContentPrepWindow: "FENÊTRE DE PRÉPARATION",
    dashStartPosting: (weeks) => weeks === 1 ? "Commencez à publier 1 semaine avant l'événement." : `Commencez à publier ${weeks} semaines avant l'événement.`,
    dashContentWindowOpensIn: (days, date) => days === 1 ? `La fenêtre de contenu s'ouvre dans 1 jour — ${date}` : `La fenêtre de contenu s'ouvre dans ${days} jours — ${date}`,
    dashContentWindowOpenNow: "La fenêtre de contenu est ouverte. Commencez à publier dès aujourd'hui.",
    dashEventHasPassed: "Cet événement est déjà passé.",
    dashCreateContentForEvent: "Créer du contenu pour cet événement",
    dashVisitOfficialSite: "Voir le site officiel",
    dashWelcomes: [
      "Aujourd'hui, un pas discret vers une vie hors du commun.",
      "Le monde récompense ceux qui agissent avec intention. À vous de jouer.",
      "Les meilleurs font aujourd'hui ce que les autres remettent à demain. Prenez les devants.",
      "Une seule conversation aujourd'hui peut changer le cours des dix prochaines années.",
      "L'excellence se construit dans l'ombre, avant que le monde ne la remarque.",
      "Votre réseau vous observe. Offrez-lui quelque chose dont il se souviendra.",
      "La discipline est l'architecture du luxe. Construisez avec intention.",
      "Faites de cette journée une évidence — dans le travail, la présence, l'exécution.",
    ],
    dashCompletionMessages: [
      "🎉 Bravo ! Les 5 rituels du jour sont terminés. Gardez cette dynamique et revenez demain pour avancer encore.",
      "🏆 Mission du jour accomplie ! Tous les rituels sont faits. Reposez-vous, rechargez les batteries, et revenez demain pour poursuivre votre série.",
      "✨ Beau travail ! Vous avez tenu parole envers vous-même aujourd'hui. Rendez-vous demain pour recommencer.",
      "🔥 Vous êtes en feu ! Les 5 rituels sont bouclés. Ce sont les petites actions quotidiennes qui font les grands résultats — à demain.",
      "💪 Encore une victoire aujourd'hui. Tous les rituels sont accomplis. Revenez demain pour garder le rythme.",
      "🌟 Remarquable ! La régularité est votre super-pouvoir. Tout est terminé — revenez demain pour le prochain défi.",
      "🚀 Progrès débloqué ! Les rituels du jour sont faits, vous voilà un peu plus proche de vos objectifs. À demain.",
      "👏 Bien joué ! Le travail du jour est terminé. Continuez d'enchaîner les victoires et revenez demain pour une nouvelle réussite.",
      "🎯 Objectif atteint ! Les 5 rituels sont accomplis. Soyez fier de cet effort et revenez demain.",
      "⚡ L'élan se construit jour après jour. Tous les rituels sont faits aujourd'hui. Revenez demain pour continuer à progresser.",
      "🏅 Réussite ! Tous les rituels du jour sont terminés. L'aventure continue — à demain.",
      "🌱 La progression se fait chaque jour, et aujourd'hui vous avez fait votre part. Tous les rituels sont complets. Revenez demain pour continuer à évoluer.",
      "💎 Discipline tenue. Tous les rituels sont accomplis. Votre futur vous dira merci — revenez demain.",
      "🎖️ Une journée parfaite de plus. Les 5 rituels sont complets. Gardez votre série vivante et revenez demain.",
      "🔥 Série sécurisée ! Tout ce qui était prévu aujourd'hui est fait. À demain pour la suite.",
      "🌄 Une journée productive s'achève. Tous les rituels sont accomplis. Reposez-vous bien et revenez demain.",
      "⭐ Excellent travail ! Vous avez mérité cette victoire du jour. Revenez demain pour continuer à construire quelque chose de grand.",
      "🛡️ Vous avez tenu votre engagement envers vous-même aujourd'hui. Tous les rituels sont accomplis. Revenez demain pour recommencer.",
      "📈 Le progrès ne s'arrête jamais. Les 5 rituels sont accomplis aujourd'hui. Revenez demain pour grimper encore.",
      "👑 Félicitations ! Les rituels du jour sont terminés. Restez régulier, restez concentré, et revenez demain pour passer au niveau suivant.",
      "✅ Rituel quotidien terminé. Cinq tâches accomplies, un pas de plus vers la vie que vous construisez. À demain.",
      "🌟 Le travail est fait aujourd'hui. Votre futur vous en profite déjà. Revenez demain pour continuer.",
      "🏆 Encore une journée réussie au compteur. Les cinq rituels sont accomplis. Revenez demain pour votre prochaine victoire.",
      "🔥 La régularité l'emporte sur la motivation. Les cinq rituels sont accomplis aujourd'hui. Revenez demain pour poursuivre la série.",
      "⚡ Progrès confirmé. Tous les rituels sont accomplis. Reposez-vous bien et revenez demain encore plus fort.",
      "🎯 Mission accomplie. Les rituels du jour sont terminés. Demain sera une nouvelle occasion de progresser.",
      "🚀 L'élan grandit. Cinq rituels accomplis. Revenez demain pour continuer d'avancer.",
      "💪 La discipline gagne encore. Toutes les tâches sont accomplies. Revenez demain pour capitaliser sur ce succès.",
      "🌱 Petites actions, grand avenir. Tous les rituels sont accomplis. Revenez demain planter une nouvelle graine.",
      "🏅 Vous avez tenu votre promesse aujourd'hui. Cinq rituels accomplis. Revenez demain pour recommencer.",
      "⭐ Une pierre de plus à l'édifice. Les cinq rituels sont accomplis. Revenez demain pour continuer à bâtir.",
      "🔥 Série protégée. Progrès assuré. Revenez demain pour poursuivre votre chemin.",
      "💎 L'excellence se construit chaque jour. Les rituels du jour sont accomplis. Revenez demain pour un pas de plus.",
      "🎖️ Vous avez mérité la victoire du jour. Les cinq rituels sont faits. Revenez demain pour le prochain défi.",
      "⚔️ La bataille pour vos objectifs continue. Le round du jour est gagné. À demain.",
      "🌄 Journée terminée. Rituels terminés. Progrès assuré. Revenez demain pour continuer à grimper.",
      "🚩 Étape franchie. Les cinq rituels sont accomplis avec succès. Revenez demain pour continuer l'aventure.",
      "📈 Progression enregistrée. Tous les rituels sont terminés. Revenez demain pour viser encore plus haut.",
      "🏔️ Les grandes réussites se construisent un jour à la fois. Le travail du jour est fait. À demain.",
      "👑 Une journée de plus conquise. Cinq rituels accomplis. Revenez demain pour poursuivre votre ascension.",
    ],
    monthShort: ["Janv.","Févr.","Mars","Avr.","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."],
    weekdayLetters: ["L","M","M","J","V","S","D"],
    // Calendar
    calEyebrow: "VOS PROGRÈS, CARTOGRAPHIÉS",
    calHeroPre: "Chaque jour vous",
    calHeroEm: "vous engagez",
    calSubtitle: "Un registre vivant de vos rituels quotidiens et un espace pour planifier la suite — accomplissements, séries et tâches avec rappels, réunis dans une seule grille.",
    calAddTask: "Ajouter une tâche",
    calToday: "Aujourd'hui",
    calRitualLabel: "Rituel quotidien",
    calRoadmapLabel: "Programme",
    calLegendDue: "Tâche à échéance",
    calLegendOverdue: "En retard",
    calLegendEvent: "Événement communautaire",
    calNoActivity: "Aucune activité ce jour",
    calDayTasksDone: (n) => `${n} tâche${n === 1 ? "" : "s"} accomplie${n === 1 ? "" : "s"}`,
    calDueToday: "À faire aujourd'hui",
    calOverdue: "En retard",
    calUpcoming: "À venir",
    calModalTitle: "Nouvelle tâche",
    calModalTitleLabel: "Titre",
    calModalTitlePlaceholder: "ex. Relancer le courtier",
    calModalDescLabel: "Notes",
    calModalDescPlaceholder: "Détail optionnel…",
    calModalDueLabel: "Date d'échéance",
    calModalReminderLabel: "Me rappeler",
    calModalReminderHint: "Nous vous enverrons un e-mail à cette heure si la tâche n'est pas encore terminée.",
    calModalPriorityLabel: "Priorité",
    calPriorityLow: "Basse",
    calPriorityMedium: "Moyenne",
    calPriorityHigh: "Haute",
    calModalSave: "Enregistrer la tâche",
    calModalSaving: "Enregistrement…",
    calModalCancel: "Annuler",
    calDeleteTask: "Supprimer",
    calMarkDone: "Marquer comme fait",
    calMarkUndone: "Marquer comme non fait",
    calEmptyDay: "Rien de prévu pour ce jour pour l'instant.",
    calSelectDayHint: "Sélectionnez un jour pour voir ce qui s'est passé — ou planifier la suite.",
    calStreakLabel: (n) => `Série de ${n} jour${n === 1 ? "" : "s"}`,
    calMonthCompletion: (pct) => `${pct}% des jours actifs ce mois-ci`,
    calReminderSet: "Rappel programmé",
    calReminderBadge: "Rappel",
    calDragToReschedule: "Glissez sur un jour pour reprogrammer",
    // Calendrier — Événements communautaires
    calCommunityTitle: "Événements communautaires",
    calCommunityDesc: "Événements partagés par d'autres acteurs de ce secteur.",
    calShareEvent: "Partager un événement",
    calNoEvents: "Aucun événement à venir",
    calNoEventsDesc: "Soyez le premier à partager un événement avec la communauté.",
    calLoadingEvents: "Chargement des événements…",
    calEventModalTitle: "Partager un événement",
    calEventTitleLabel: "Titre de l'événement",
    calEventTitlePlaceholder: "ex. Monaco Yacht Show — rencontre",
    calEventDescLabel: "Description",
    calEventDescPlaceholder: "Ce qui se passe, qui devrait venir…",
    calEventLocationLabel: "Lieu",
    calEventLocationPlaceholder: "ex. Port Hercule, Monaco",
    calEventStartLabel: "Début",
    calEventEndLabel: "Fin (facultatif)",
    calEventSave: "Partager l'événement",
    calEventSaving: "Partage…",
    calRsvp: "Participer",
    calRsvped: "J'y participe",
    calAttendees: (n) => (n === 1 ? "1 participant" : `${n} participants`),
    calDeleteEvent: "Supprimer l'événement",
    calOrganizedBy: (name) => `Organisé par ${name}`,
    // Roadmap
    roadmapEyebrow: (mode) => `PROGRAMME · ${mode.toUpperCase()}`,
    roadmapBuilding: "Création de votre programme…",
    roadmapDefaultHeadline: "Votre programme de 30 jours",
    roadmapDescription: "Un programme personnalisé de 30 jours conçu autour de votre secteur, votre niveau et vos objectifs. Des actions quotidiennes concrètes — cochez-les au fur et à mesure.",
    roadmapRegenerate: "Régénérer",
    roadmapGenerating: "Génération…",
    roadmapOverallProgress: "Progression globale",
    roadmapArchitecting: "Élaboration de votre programme…",
    roadmapArchitectingDesc: (industry) => `AURUM construit 30 jours d'exécution de précision pour le secteur ${industry}. Cela prend environ 15 secondes.`,
    roadmapWeekLabel: (n) => `Semaine ${n} · `,
    roadmapWeekHeader: (n) => `SEMAINE ${n}`,
    roadmapMilestone: "ÉTAPE CLÉ",
    roadmapPrevWeek: "← Semaine précédente",
    roadmapNextWeek: "Semaine suivante →",
    roadmapGetHelp: "Obtenir de l'aide",
    roadmapHideHelp: "Masquer l'aide",
    roadmapHelpLoading: "Recherche de la meilleure aide…",
    roadmapHelpFailed: "Impossible de charger l'aide — réessayez.",
    roadmapSwapTask: "Changer la tâche",
    roadmapSwapping: "Changement…",
    roadmapSwapFailed: "Impossible de changer cette tâche — réessayez.",
    roadmapContinueInMentor: "Continuer avec le Mentor",
    roadmapHelpGateMessage: "Vous avez utilisé vos sessions d'aide gratuites. Passez à Pro pour une aide illimitée sur chaque tâche.",
    roadmapMarkComplete: "Marquer comme terminé",
    roadmapMarkIncomplete: "Marquer comme non terminé",
    roadmapLockTitle: "Votre feuille de route de 30 jours",
    roadmapLockDesc: "Un plan d'exécution jour par jour construit pour votre objectif — quatre semaines de tâches de réseautage, de contenu et de prospection, planifiées et synchronisées avec votre calendrier.",
    roadmapLockFeatures: [
      "Plan complet de 30 jours, semaine par semaine",
      "Aide IA « Obtenir de l'aide » sur chaque tâche",
      "Synchronisation automatique avec votre calendrier",
      "Régénérez à tout moment selon l'évolution de votre objectif",
    ],
    typeNetworking: "Réseautage",
    typeContent: "Contenu",
    typeLearning: "Apprentissage",
    typeOutreach: "Prospection",
    typeMindset: "Mental",
    // Intelligence
    intelEyebrow: (mode, category) => `AURUM · ${mode.toUpperCase()} · ${category.toUpperCase()}`,
    intelHeadline: "Le signal au cœur du bruit.",
    intelDescPre: "Synthèse en temps réel du réseau de renseignement AURUM — adaptée à ",
    intelYour: "votre",
    intelDescPost: (industry) => ` position sur le marché ${industry.toLowerCase()}.`,
    intelLive: "EN DIRECT",
    intelSync: (time) => `Synchro ${time}`,
    intelSyncing: "Synchronisation…",
    intelJustNow: "à l'instant",
    intelMinAgo: (n) => `il y a ${n} min`,
    intelHourAgo: (n) => n === 1 ? "il y a 1 h" : `il y a ${n} h`,
    intelDayAgo: (n) => n === 1 ? "il y a 1 j" : `il y a ${n} j`,
    intelSignalsTracked: "Signaux suivis",
    intelSources: "Sources",
    intelRealtime: "Temps réel",
    intelOn: "ACTIF",
    intelLatest: "RÉCENT",
    intelSignalsOf: (category) => `Signaux · ${category}`,
    intelReadBrief: "Lire la synthèse",
    intelGenerateContent: "Générer du contenu",
    categoryLabel: (category) => ({ yachting: "Yachting", property: "Immobilier", aviation: "Aviation", automotive: "Automobile" }[category] ?? category),
    // Mentor
    mentorMinAgo: (n) => `il y a ${n} min`,
    mentorHourAgo: (n) => n === 1 ? "il y a 1 h" : `il y a ${n} h`,
    mentorYesterday: "Hier",
    mentorOpener: (greeting, userName, persona, industry) => `${greeting}, ${userName}. Je suis votre ${persona} d'AURUM — ici pour vous aider à percer dans le secteur ${industry.toLowerCase()} au plus haut niveau. Quel est votre défi le plus urgent en ce moment ?`,
    mentorThinking: "AURUM réfléchit...",
    mentorPlaceholder: (industry) => `Interrogez AURUM sur le secteur ${industry.toLowerCase()} — stratégie, prospection, le marché...`,
    mentorFreeMessages: "messages gratuits",
    mentorOnline: "EN LIGNE",
    mentorNewConversation: "Nouvelle conversation",
    mentorRecentConversations: "CONVERSATIONS RÉCENTES",
    mentorConvMeta: (date, n) => `${date} · ${n} message${n === 1 ? "" : "s"}`,
    mentorDeleteConversation: "Supprimer la conversation",
    mentorQuickInvocations: "INVOCATIONS RAPIDES",
    mentorContextLoaded: "CONTEXTE CHARGÉ",
    mentorExecutionStreak: (n) => n === 1 ? "1 jour de série d'exécution" : `${n} jours de série d'exécution`,
    mentorTasksCompletedToday: (n) => n === 1 ? "1 tâche complétée aujourd'hui" : `${n} tâches complétées aujourd'hui`,
    mentorGateMessage: "Vous avez utilisé vos 5 messages gratuits avec le mentor. Passez à Pro pour un accès illimité.",
    mentorGateMessageModal: "Vous avez utilisé vos 5 messages gratuits avec le mentor. Passez à Pro pour un mentorat IA illimité.",
    mentorErrorPrefix: "Erreur : ",
    mentorContent: (industryId) => ({
      yachts: {
        persona: "AURUM · Conseil Yachting",
        specialty: "Courtage, charter, psychologie des propriétaires · ancré à Monaco",
        prompts: [
          "Planifier ma semaine du Monaco Yacht Show",
          "Revoir mon positionnement LinkedIn de courtier",
          "Rédiger une demande de charter pour un prospect UHNW",
          "M'entraîner à une conversation avec un courtier senior",
        ],
      },
      villas: {
        persona: "AURUM · Conseil Ultra-Prime",
        specialty: "Immobilier d'exception, investisseurs UHNW, promoteurs · Dubaï/Miami/Monaco",
        prompts: [
          "Planifier ma semaine sur le marché trophée de Dubaï",
          "Revoir mon positionnement en immobilier de luxe",
          "Rédiger une approche pour un investisseur UHNW",
          "M'entraîner à un pitch auprès d'un promoteur",
        ],
      },
      jets: {
        persona: "AURUM · Conseil Aviation",
        specialty: "Courtage d'avions, charter, fractionnel, voyages UHNW",
        prompts: [
          "Planifier ma semaine EBACE / NBAA",
          "Revoir mon positionnement LinkedIn aviation",
          "Rédiger une approche pour un propriétaire de Global 7500",
          "M'entraîner à un appel de tarification de charter",
        ],
      },
      cars: {
        persona: "AURUM · Conseil Collectionneur",
        specialty: "Hypercars, ventes aux enchères de collection, relations concessionnaires, politique d'allocation",
        prompts: [
          "Planifier ma Monterey Car Week",
          "Revoir mon positionnement LinkedIn de collectionneur",
          "Rédiger une approche pour un contact d'allocation d'hypercar",
          "M'entraîner à une négociation de gré à gré",
        ],
      },
    })[industryId],
    // Academy
    acadEyebrow: (mode) => `ACADÉMIE · ${mode}`,
    acadHeroPre: "Devenez un initié —",
    acadHeroEm: "méthodiquement.",
    acadTracks: "PARCOURS",
    acadIndustryCurricula: "Programmes par secteur",
    acadModules: (n) => `${n} modules`,
    acadComingSoon: "Bientôt disponible",
    acadComplete: (done, total) => `${done}/${total} terminés`,
    acadComingSoonTitle: (trackName) => `${trackName} — Bientôt disponible`,
    acadComingSoonDesc: "Ce programme est en cours de conception par des experts du secteur. Passez au parcours Courtage Yacht pour commencer dès maintenant.",
    acadAiTutorTitle: "Tuteur IA pour ce module",
    acadBeginRolePlay: "Commencer la mise en situation →",
    acadCourseComingSoon: "Cours bientôt disponible",
    acadCourseComingSoonDesc: "Ce programme est en cours de création. Passez au parcours Courtage Yacht pour commencer dès maintenant.",
    acadAdminViewNotice: "⚠ Vue admin — ce parcours est verrouillé pour les utilisateurs. Ajoutez du contenu et des quiz ici pour préparer le lancement.",
    acadActiveTrack: (track) => `PARCOURS ACTIF · ${track}`,
    acadYachtBrokerage: "COURTAGE YACHT",
    acadYourProgramme: "Votre programme de 10 modules",
    acadOfTenComplete: (n) => `${n}/10 terminés`,
    acadAdmin: "Admin",
    acadPhase: (num, title) => `Phase ${num} — ${title}`,
    acadVideoAvailable: "Vidéo disponible",
    acadNoVideoYet: "Pas encore de vidéo",
    acadStart: "Commencer",
    acadBackToModules: "Retour aux modules",
    acadModuleOf: (num, phase) => `MODULE ${num} · PHASE ${phase}`,
    acadCompleted: "TERMINÉ",
    acadClose: "Fermer",
    acadEdit: "Modifier",
    acadMarkWatched: "Marquer la vidéo comme vue",
    acadVideoComingSoon: "Contenu vidéo bientôt disponible",
    acadAddVideoUrlHint: "Ajoutez une URL vidéo en mode édition ci-dessus",
    acadDownloads: "TÉLÉCHARGEMENTS",
    acadModuleQuiz: "QUIZ DU MODULE",
    acadQuizPassed: "Quiz réussi",
    acadScoreNextUnlocked: (score) => `Score : ${score}/5 · Module suivant débloqué`,
    acadAddQuestionsHint: "Ajoutez 5 questions en mode édition pour activer le quiz.",
    acadQuizComingSoon: "Quiz bientôt disponible.",
    acadQuizInstructions: "5 questions · Score de 3/5 ou plus pour débloquer le module suivant",
    acadLastScore: (score, attempts) => `Dernier score : ${score}/5 · Tentatives : ${attempts}`,
    acadRetryQuiz: "Refaire le quiz",
    acadTakeQuiz: "Passer le quiz",
    acadBackToModule: "Retour au module",
    acadQuizModule: (num) => `QUIZ · MODULE ${num}`,
    acadAnswerAll: "Répondez aux 5 questions · Score de 3/5 ou plus pour réussir.",
    acadModuleComplete: "Module terminé !",
    acadScoredUnlocked: (score) => `Vous avez obtenu ${score}/5 — le module suivant est maintenant débloqué.`,
    acadContinue: "Continuer →",
    acadNotQuite: "Pas tout à fait",
    acadScoredRetry: (score, pass) => `Vous avez obtenu ${score}/5 — il vous faut ${pass} bonnes réponses pour réussir. Révisez le module et réessayez.`,
    acadTryAgain: "Réessayer",
    acadSubmitAnswers: "Valider les réponses",
    acadSubmitting: "Envoi en cours…",
    acadSubmitFailed: "Impossible d'envoyer vos réponses — vérifiez votre connexion et réessayez.",
    acadPhaseTitle: (phaseNumber, fallback) => ({
      1: "Comprendre le secteur",
      2: "Se positionner professionnellement",
      3: "Comprendre le fonctionnement du courtage",
      4: "Construire votre carrière",
    } as Record<number, string>)[phaseNumber] ?? fallback,
    acadModuleTitle: (track, moduleNumber, fallback) => ({
      cars: {
        1: "Introduction aux voitures d'exception et de collection",
        2: "Types de véhicules et segments de marché",
        3: "Que fait un spécialiste automobile de luxe ?",
        4: "Développer votre profil de spécialiste",
        5: "Réseaux sociaux et vente automobile moderne",
        6: "Communiquer avec des collectionneurs UHNW",
        7: "Comment trouver votre premier véhicule",
        8: "Comment travailler avec des acheteurs en vente aux enchères et de gré à gré",
        9: "Provenance, évaluations et documentation",
        10: "Exploiter Aurum OS pour réussir durablement",
      },
      jets: {
        1: "Introduction à l'aviation privée",
        2: "Types d'avions et spécifications",
        3: "Que fait un courtier en aviation ?",
        4: "Développer votre profil dans l'aviation",
        5: "Réseaux sociaux et courtage aéronautique moderne",
        6: "Communiquer avec des clients UHNW",
        7: "Comment trouver votre premier avion",
        8: "Comment travailler avec des acheteurs et des opérateurs",
        9: "Réglementation, navigabilité et contrats",
        10: "Exploiter Aurum OS pour réussir durablement",
      },
      villas: {
        1: "Introduction à l'immobilier ultra-prime",
        2: "Types de biens et segments de marché",
        3: "Que fait un courtier immobilier de luxe ?",
        4: "Développer votre profil de courtier",
        5: "Réseaux sociaux et courtage immobilier moderne",
        6: "Communiquer avec des clients UHNW",
        7: "Comment trouver votre premier mandat",
        8: "Comment travailler avec acheteurs et vendeurs",
        9: "Cadres juridiques, contrats et conformité",
        10: "Exploiter Aurum OS pour réussir durablement",
      },
      yachts: {
        1: "Introduction au monde du yachting",
        2: "Les différents types de yachts",
        3: "Que fait réellement un courtier en yachts ?",
        4: "Développer votre profil de courtier",
        5: "Réseaux sociaux et courtage de yachts moderne",
        6: "Communiquer avec des clients UHNW",
        7: "Comment trouver votre premier bateau",
        8: "Comment interagir avec les acheteurs",
        9: "Administration, réglementation et contrats",
        10: "Exploiter Aurum OS pour réussir durablement",
      },
    } as Record<string, Record<number, string>>)[track]?.[moduleNumber] ?? fallback,
    acadTutorBlurb: (industryId) => ({
      yachts: "Mettez en pratique « la retenue comme levier » lors d'une mise en situation avec AURUM, qui joue le rôle d'un propriétaire sceptique d'un yacht de 80 m.",
      villas: "Simulez la recherche d'un mandat confidentiel pour un client UHNW — AURUM joue le rôle d'un agent monégasque discret représentant le vendeur.",
      jets: "Simulez un appel acheteur pour un mandat Global 7500 — AURUM joue un client sceptique hésitant entre achat complet et programme fractionné.",
      cars: "Simulez la construction de votre récit de collectionneur pour une allocation Pagani Utopia — AURUM joue le responsable des relations clients de Lorenzo.",
    })[industryId],
    // Tutor
    tutTitle: "AURUM Tuteur IA",
    tutSubtitle: (trackName) => `${trackName} · apprentissage étape par étape`,
    tutOnline: "EN LIGNE",
    tutComposing: "Le tuteur rédige une réponse...",
    tutPlaceholder: (industryId) => ({
      yachts: "Demandez au tuteur d'expliquer un concept du yachting...",
      villas: "Demandez au tuteur d'expliquer un concept de l'immobilier de prestige...",
      jets: "Demandez au tuteur d'expliquer un concept de l'aviation privée...",
      cars: "Demandez au tuteur d'expliquer un concept de l'automobile de collection...",
    })[industryId],
    tutNewLesson: "Nouvelle leçon",
    tutRecentLessons: "LEÇONS RÉCENTES",
    tutDeleteLesson: "Supprimer la leçon",
    tutMessagesCount: (n) => `${n} messages`,
    tutMinsAgo: (n) => `il y a ${n} min`,
    tutHoursAgo: (n) => `il y a ${n} h`,
    tutYesterday: "Hier",
    tutLessonStarters: "SUJETS DE LEÇON",
    tutActiveTrackLabel: "PARCOURS ACTIF",
    tutModulesComplete: (done, total) => `${done}/${total} modules terminés`,
    tutModeLine: (mode) => `Mode · ${mode}`,
    tutPhaseLine: (phase) => `Phase · ${phase}`,
    tutOpener: (trackName) =>
      `Bienvenue dans le parcours ${trackName}. Je suis votre Tuteur IA — demandez-moi d'expliquer un module, un terme ou un concept et je vous le détaillerai étape par étape. Par où souhaitez-vous commencer ?`,
    tutSuggestions: (industryId) => ({
      yachts: [
        "Expliquez-moi les fondamentaux du marché de la location de yachts",
        "Présentez-moi le module 1 du parcours Courtage Yacht étape par étape",
        "Quelle terminologie d'initié devrais-je maîtriser en premier ?",
        "Interrogez-moi sur un concept clé de ce parcours",
      ],
      villas: [
        "Expliquez-moi les fondamentaux du marché immobilier ultra-prime",
        "Présentez-moi le module 1 du parcours Immobilier Ultra-Prime étape par étape",
        "Quelle terminologie d'initié devrais-je maîtriser en premier ?",
        "Interrogez-moi sur un concept clé de ce parcours",
      ],
      jets: [
        "Expliquez-moi les fondamentaux du marché des avions d'occasion",
        "Présentez-moi le module 1 du parcours Aviation Privée étape par étape",
        "Quelle terminologie d'initié devrais-je maîtriser en premier ?",
        "Interrogez-moi sur un concept clé de ce parcours",
      ],
      cars: [
        "Expliquez-moi les fondamentaux du marché des voitures de collection",
        "Présentez-moi le module 1 du parcours Automobile d'Exception étape par étape",
        "Quelle terminologie d'initié devrais-je maîtriser en premier ?",
        "Interrogez-moi sur un concept clé de ce parcours",
      ],
    })[industryId],
    tutGateMessage: "Vous avez utilisé vos 5 messages gratuits avec le tuteur. Passez à Pro pour un tutorat IA illimité.",
    tutLockTitle: "Tuteur IA",
    tutLockDesc: "Des leçons pas à pas adaptées à votre parcours exact, avec des questions de suivi illimitées dès que vous êtes bloqué.",
    tutLockFeatures: [
      "Conversations illimitées avec le tuteur",
      "Leçons structurées, adaptées à votre parcours",
      "Historique des leçons sauvegardé",
      "Personnalisé selon votre parcours et votre secteur",
    ],
    // Network
    netEyebrow: (mode) => `RÉSEAU · ${mode}`,
    netHeroPre: "La pièce où vous",
    netHeroEm: "êtes déjà.",
    netSubtitle: "Gérez vos contacts, rédigez des messages adaptés à chaque catégorie et suivez chaque envoi.",
    netTabContacts: (n) => `Contacts (${n})`,
    netTabDrafts: (n) => `Brouillons (${n})`,
    netTabCompose: "Composer",
    netYourNetwork: "VOTRE RÉSEAU",
    netContacts: "Contacts",
    netAddContact: "Ajouter un contact",
    netNewContact: "Nouveau contact",
    netNotesPlaceholder: "Notes…",
    netCancel: "Annuler",
    netSaveContact: "Enregistrer le contact",
    netLoadingContacts: "Chargement des contacts…",
    netNoContacts: "Aucun contact pour l'instant",
    netNoContactsDesc: "Ajoutez votre premier contact pour commencer à rédiger des messages personnalisés.",
    netDraftMessage: "Rédiger un message",
    netOutreach: "PROSPECTION",
    netDraftAMessage: "Rédiger un message",
    netTo: "DESTINATAIRE",
    netAddContactFirst: "Ajoutez d'abord un contact →",
    netPlatform: "PLATEFORME",
    netRoleCategory: "RÔLE / CATÉGORIE",
    netCategories: (industryId) => ({
      yachts: ["Courtier charter", "Courtier vente", "Capitaine / Équipage", "Chantier naval", "Marina", "Gestion de charter", "Assurance", "Expertise / Refit"],
      villas: ["Promoteur", "Agent immobilier prime", "Gestionnaire de bien", "Architecte d'intérieur", "Assurance", "Juridique / Fiscal", "Banque privée"],
      jets: ["Courtier", "Opérateur charter", "Maintenance (MRO)", "FBO", "Assurance", "Family office", "Société de gestion"],
      cars: ["Concessionnaire", "Maison de vente aux enchères", "Collectionneur", "Spécialiste / Restaurateur", "Assurance", "Transport", "Organisateur de concours"],
    })[industryId],
    netDefaultCategories: ["Direction", "Courtier", "Assurance", "Agence", "Propriétaire", "Investisseur", "Média"],
    netSubject: "OBJET",
    netSubjectPlaceholder: "Présentation — Votre nom",
    netSelectContactHint: "↑ Sélectionnez un contact ci-dessus pour générer un message personnalisé",
    netSelectContactFirstError: "Sélectionnez d'abord un contact.",
    netDraftFailed: "La génération du message a échoué. Réessayez.",
    netGateMessage: "Vous avez utilisé vos 2 brouillons gratuits. Passez à Pro pour une prospection illimitée.",
    netDrafting: "Rédaction en cours…",
    netDraftMessageTo: (name) => `Rédiger un message à ${name}`,
    netSelectContactFirstBtn: "Sélectionnez d'abord un contact",
    netMessage: "MESSAGE",
    netMessagePlaceholder: "Votre message apparaîtra ici après génération, ou saisissez-le directement…",
    netCopied: "Copié",
    netCopy: "Copier",
    netSaveDraft: "Enregistrer le brouillon",
    netSend: "Envoyer",
    netHistory: "HISTORIQUE",
    netDraftsTitle: "Brouillons",
    netLoading: "Chargement…",
    netNoMessages: "Aucun message pour l'instant",
    netNoMessagesDesc: "Rédigez et envoyez des messages depuis l'onglet Composer.",
    netStatusSent: "envoyé",
    netStatusDraft: "brouillon",
    netJustNow: "À l'instant",
    netHoursAgo: (h) => `il y a ${h} h`,
    netYesterday: "Hier",
    netModifyDraft: "Modifier le brouillon",
    netDeleteDraft: "Supprimer le brouillon",
    netRe: (subject) => `Objet : ${subject}`,
    // Réseau — Communauté
    comTab: "Communauté",
    comSectionEyebrow: "DISCUSSION",
    comBoardTitle: "Forum communautaire",
    comBoardDesc: "Posez des questions, partagez vos connaissances et échangez avec d'autres acteurs de ce secteur.",
    comNewPost: "Nouveau sujet",
    comPostTitlePlaceholder: "Donnez un titre clair…",
    comPostBodyPlaceholder: "Partagez une connaissance, posez une question, lancez une discussion…",
    comPublish: "Publier",
    comPosting: "Publication…",
    comPostFailed: "Impossible de publier. Réessayez.",
    comEmptyTitle: "Aucun sujet pour le moment",
    comEmptyDesc: "Soyez le premier à lancer une discussion dans ce secteur.",
    comLoading: "Chargement des discussions…",
    comBack: "Retour au forum",
    comRepliesCount: (n) => (n === 1 ? "1 réponse" : `${n} réponses`),
    comReplyPlaceholder: "Participer à la discussion…",
    comReplyButton: "Répondre",
    comReplyingBtn: "Publication…",
    comReplyFailed: "Impossible de publier la réponse. Réessayez.",
    comNoReplies: "Aucune réponse pour le moment",
    comNoRepliesDesc: "Soyez le premier à répondre.",
    comDeletePost: "Supprimer le sujet",
    comDeleteReply: "Supprimer la réponse",
    comReport: "Signaler",
    comReportTitle: "Signaler ce contenu",
    comReportReasonPlaceholder: "Facultatif — expliquez le problème",
    comReportSubmit: "Envoyer le signalement",
    comReportSuccess: "Signalé. Merci.",
    comReportFailed: "Impossible d'envoyer le signalement. Réessayez.",
    comMember: "Membre",
    comYou: "Vous",
    comUpvote: "Voter",
    // Studio
    stuGateMessage: "Vous avez utilisé votre brouillon de contenu gratuit. Passez à Pro pour une génération illimitée.",
    stuUpgradeReason: "Vous avez utilisé votre brouillon de contenu gratuit. Passez à Pro pour une génération de contenu IA illimitée.",
    stuGenerationFailed: "La génération a échoué",
    stuEyebrow: (mode) => `Studio de contenu · ${mode}`,
    stuFreeDraftLabel: "brouillon gratuit",
    stuHeroPre: "Du contenu viral,",
    stuHeroEm: "à la demande.",
    stuSubtitle: (label) => `Le directeur de création IA d'AURUM conçoit du contenu prêt à publier pour l'univers ${label} — accroches, légendes, scripts, hashtags, visuels. Prêt en moins de 30 secondes.`,
    stuTags: ["Accroches virales", "Légendes par plateforme", "Hashtags", "Visuels IA"],
    stuHistory: (n) => `Historique (${n})`,
    stuContentHistory: (label) => `HISTORIQUE DE CONTENU · ${label}`,
    stuUntitled: "Sans titre",
    stuDeleteDraft: "Supprimer le brouillon",
    stuModeAssisted: "Assisté par IA",
    stuModeAssistedSub: "Rédigez à partir de votre propre idée",
    stuModeIntel: "Signaux en direct",
    stuModeIntelSub: "Amplifiez les signaux du jour",
    stuYourIdea: "VOTRE IDÉE",
    stuIdeaPlaceholder: `ex. « Pourquoi les superyachts hybrides sont devenus le nouveau symbole de statut à Monaco »`,
    stuSignalsLabel: "SIGNAUX · choisissez ce qu'il faut amplifier",
    stuNoSignals: "Aucun signal en direct pour le moment. Passez en mode Assisté par IA pour rédiger à partir de votre propre idée.",
    stuNoneSelected: "Aucun signal sélectionné → AURUM analysera les principaux signaux du jour.",
    stuSignalsSelected: (n) => `${n} signal${n > 1 ? "aux" : ""} sélectionné${n > 1 ? "s" : ""}.`,
    stuGoalLabel: "OBJECTIF",
    stuOptional: "(facultatif)",
    stuGoalPlaceholder: "ex. attirer des clients de charter UHNW",
    stuFormatLabel: "FORMAT",
    stuFormatPost: "Publication",
    stuFormatPostDesc: "Facebook · X · LinkedIn",
    stuFormatImage: "Image",
    stuFormatImageDesc: "TikTok · IG · YouTube",
    stuFormatVideo: "Vidéo",
    stuFormatVideoDesc: "TikTok · IG · YouTube",
    stuDurationLabel: "DURÉE",
    stuDuration1Min: "1 min",
    stuOrientationLabel: "ORIENTATION",
    stuOrientPortrait: "Portrait",
    stuOrientLandscape: "Paysage",
    stuOrientAuto: "Auto",
    stuOrientAdaptive: "Adaptatif",
    stuGenerateButton: "Générer du contenu viral",
    stuApprox30s: "~30 s",
    stuReadyTitle: "Votre contenu, prêt en 30 s",
    stuReadyDesc: (label) => `Accroche · Légendes · Script · Hashtags · Visuel — tout en un, adapté à l'univers ${label}.`,
    stuComposing: "Composition de votre contenu…",
    stuLoadSteps: [
      "Analyse des signaux du jour...",
      "Rédaction de votre accroche...",
      "Écriture des légendes par plateforme...",
      "Finalisation des hashtags et visuels...",
    ],
    stuLiveSignalsEyebrow: "SIGNAUX EN DIRECT",
    stuIdeasToExpand: "Idées à développer",
    stuLiveSignalFallback: "SIGNAL EN DIRECT",
    stuContentTitle: "TITRE DU CONTENU",
    stuViralHookLabel: "Accroche virale · Premières 2 secondes",
    stuModify: "Modifier",
    stuSave: "Enregistrer",
    stuCancel: "Annuler",
    stuOpening: "Ouverture…",
    stuOpen: "Ouvrir",
    stuCopied: "Copié",
    stuCopy: "Copier",
    stuContentScript: "SCRIPT DU CONTENU",
    stuScriptPlaceholder: "Une réplique par ligne…",
    stuHashtags: "HASHTAGS",
    stuHashtagsPlaceholder: "#yacht #luxe …",
    stuVisualPrompt: "PROMPT VISUEL",
    stuGenerateImage: "Générer l'image",
    stuGeneratingVisual: "Génération de votre visuel…",
    stuImageFailed: "La génération de l'image a échoué. Réessayez.",
    stuRetry: "Réessayer",
    stuDownload: "Télécharger",
    stuRegenerate: "Régénérer",
    stuPostOn: "PUBLIER VOTRE CONTENU SUR",
    stuConnected: "Connecté",
    stuConnectArrow: "Connecter →",
    stuCaptionLinked: (labels) => `Légende liée : ${labels}`,
    stuPostNow: "Publier votre contenu maintenant",
    stuSavedExcl: "Enregistré !",
    stuSaving: "Enregistrement…",
    stuSchedulePost: "Programmer la publication",
    stuPostScheduled: "Publication programmée avec succès",
    stuScheduleHeader: "PROGRAMMER LA PUBLICATION",
    stuDate: "Date",
    stuTime: "Heure",
    stuConfirmSchedule: "Confirmer la programmation",
    stuScheduling: "Programmation…",
    profLoadingDossier: "Chargement du dossier…",
    profUnnamedOperator: "Opérateur sans nom",
    profModeBadge: (label) => `Mode ${label}`,
    profMyMission: "MA MISSION",
    profMissionPlaceholder: 'Ajoutez votre mission — ex. « Percer le courtage de yachts à Monaco avant le T4 »',
    profEditIdentity: "MODIFIER L'IDENTITÉ",
    profUnlockDossier: "Ajoutez votre nom et votre mission pour débloquer votre dossier.",
    profAurumScore: "SCORE AURUM",
    profReadinessIndex: "Votre indice de préparation",
    profMomentum: "ÉLAN",
    profDayStreak: "jours consécutifs",
    profPhase: "PHASE",
    profOnboarding: "Intégration",
    profToNextPhase: (pct) => `${pct} % vers la phase suivante`,
    profScoreBreakdownEyebrow: "DÉTAIL DU SCORE AURUM",
    profScoreBreakdownTitle: "Ce qui construit votre score.",
    profKnowledge: "Connaissances",
    profKnowledgeHint: "Terminer des modules de l'Académie",
    profNetwork: "Réseau",
    profNetworkHint: "Établir des relations et des présentations",
    profVisibility: "Visibilité",
    profVisibilityHint: "Publier du contenu et des analyses",
    profExecution: "Exécution",
    profExecutionHint: "Terminer les tâches quotidiennes",
    profIdentity: "Identité",
    profIdentityHint: "Compléter votre profil",
    profConnectedAccountsEyebrow: "COMPTES CONNECTÉS",
    profConnectedAccountsTitle: "Votre réseau de diffusion.",
    profConnectDesc: "Connectez vos comptes pour qu'AURUM puisse publier directement en votre nom.",
    profConnected: "CONNECTÉ",
    profNotConnected: "NON CONNECTÉ",
    profDisconnect: "Déconnecter",
    profConnect: "Connecter",
    profEditIdentityTitle: "Modifier l'identité",
    profEditIdentityDesc: "Votre dossier façonne chaque recommandation d'AURUM.",
    profFieldFullName: "Nom complet",
    profFieldProfession: "Profession actuelle",
    profFieldLocation: "Lieu",
    profFieldMission: "Ma mission",
    profFieldGoal: "Objectif",
    profFieldPhotoUrl: "URL de la photo",
    profFieldLinkedinUrl: "URL LinkedIn",
    profFieldInstagramUrl: "URL Instagram",
    profPlaceholderProfession: "Analyste en courtage de yachts",
    profPlaceholderMission: "Percer le courtage de yachts à Monaco avant le T4",
    profPlaceholderGoal: "Signer le premier mandat de courtage",
    profCancel: "Annuler",
    profSave: "Enregistrer",
    profConnectPlatform: (name) => `Connecter ${name}`,
    profConnectHintSuffix: " — AURUM utilisera cette information pour rediriger votre contenu vers la bonne plateforme.",
    profPlatformLinkedinLabel: "URL DE PROFIL OU NOM D'UTILISATEUR",
    profPlatformLinkedinHint: "L'URL de votre profil LinkedIn ou votre nom d'utilisateur",
    profPlatformUsernameLabel: "NOM D'UTILISATEUR",
    profPlatformInstagramHint: "Votre identifiant Instagram (sans @)",
    profPlatformTwitterHint: "Votre identifiant X / Twitter",
    profPlatformTiktokHint: "Votre identifiant TikTok",
    profPlatformYoutubeLabel: "NOM DE CHAÎNE OU URL",
    profPlatformYoutubeHint: "Le nom ou l'URL de votre chaîne YouTube",
    profPlatformSubstackLabel: "URL SUBSTACK",
    profPlatformSubstackHint: "L'URL complète de votre publication Substack",
    profConnecting: "Connexion…",
    setPreferencesEyebrow: "PRÉFÉRENCES",
    setTuneTitle: "Ajustez votre système d'exploitation",
    setSectionAccount: "Compte",
    setSectionAurum: "Mon AURUM",
    setSectionContent: "Contenu",
    setSectionNotifications: "Notifications",
    setSectionPrivacy: "Confidentialité",
    setSectionBilling: "Facturation",
    setSectionDanger: "Zone de danger",
    setSoon: "BIENTÔT",
    setAccountTitle: "Compte",
    setAccountDesc: "Gérez vos informations personnelles et vos identifiants de connexion.",
    setFieldFullName: "Nom complet",
    setFullNamePlaceholder: "Votre nom",
    setFieldEmail: "Adresse e-mail",
    setEmailPlaceholder: "vous@domaine.com",
    setEmailChangeHint: "La modification de votre e-mail nécessite une confirmation depuis la nouvelle adresse.",
    setSaveChanges: "Enregistrer les modifications",
    setFieldPassword: "Mot de passe",
    setPasswordResetDesc: "Nous vous envoyons un lien de réinitialisation par e-mail.",
    setSendPasswordReset: "Envoyer l'e-mail de réinitialisation",
    setEmailChangeToast: "Vérifiez votre nouvelle adresse e-mail pour confirmer le changement.",
    setAccountUpdatedToast: "Compte mis à jour.",
    setSaveFailedToast: "Échec de l'enregistrement",
    setPasswordResetSentToast: "E-mail de réinitialisation envoyé. Vérifiez votre boîte de réception.",
    setAurumTitle: "Mon AURUM",
    setAurumDesc: "Personnalisez votre mentor IA, vos rituels quotidiens et votre système d'exploitation.",
    setActiveMode: "Mode actif",
    setModeSwitchedToast: (label) => `Basculé en mode ${label}`,
    setExperienceLevel: "Niveau d'expérience",
    setLevelBeginner: "Débutant",
    setLevelBeginnerDesc: "En exploration, construction des bases",
    setLevelIntermediate: "Intermédiaire",
    setLevelIntermediateDesc: "Dans le secteur, en accélération",
    setLevelExperienced: "Expérimenté",
    setLevelExperiencedDesc: "Établi, en phase d'expansion",
    setLevelUpdatedToast: "Niveau mis à jour",
    setMyGoal: "Mon objectif",
    setGoalPlaceholder: "ex. Signer le premier mandat de courtage avant le T4",
    setGoalSavedToast: "Objectif enregistré",
    setGoalHint: "Utilisé par votre mentor IA pour personnaliser chaque recommandation.",
    setDailyRitualIntensity: "Intensité du rituel quotidien",
    setTasksLabel: (n) => `${n} tâches`,
    setDailyTasksToast: (n) => `Tâches quotidiennes fixées à ${n}`,
    setMentorTone: "Ton du mentor",
    setToneStrategic: "Stratégique",
    setToneStrategicDesc: "Calme, direct, sans détour",
    setToneWarm: "Chaleureux",
    setToneWarmDesc: "Encourageant et bienveillant",
    setToneSocratic: "Socratique",
    setToneSocraticDesc: "Challenge votre réflexion",
    setMentorToneToast: "Ton du mentor mis à jour",
    setAiResponseStyle: "Style de réponse IA",
    setStyleConcise: "Concis",
    setStyleConciseDesc: "Réponses courtes et précises",
    setStyleDetailed: "Détaillé",
    setStyleDetailedDesc: "Explications approfondies",
    setAiStyleToast: "Style IA mis à jour",
    setResetOnboarding: "Réinitialiser l'intégration",
    setResetOnboardingDesc: "Refaites votre configuration pour changer de secteur et d'objectifs depuis le début.",
    setRedoOnboarding: "Refaire l'intégration",
    setContentTitle: "Contenu & Intelligence",
    setContentDesc: "Contrôlez la façon dont AURUM génère du contenu pour vous.",
    setPreferredPlatforms: "Plateformes préférées",
    setPlatformAll: "Toutes les plateformes",
    setPlatformLinkedinOnly: "LinkedIn uniquement",
    setPlatformInstagramOnly: "Instagram uniquement",
    setPlatformLinkedinInstagram: "LinkedIn + Instagram",
    setPlatformsUpdatedToast: "Plateformes mises à jour",
    setContentTone: "Ton du contenu",
    setToneProfessional: "Professionnel",
    setToneConversational: "Conversationnel",
    setToneBold: "Audacieux",
    setContentToneUpdatedToast: "Ton du contenu mis à jour",
    setAutoGenerateDailyBrief: "Génération automatique du brief quotidien",
    setDailyBrief: "Brief quotidien",
    setDailyBriefDesc: "Génère automatiquement votre brief chaque matin",
    setDailyBriefEnabledToast: "Brief quotidien activé",
    setDailyBriefDisabledToast: "Brief quotidien désactivé",
    setNotificationsTitle: "Notifications",
    setNotificationsDesc: "Choisissez les alertes que vous recevez dans AURUM OS.",
    setNotifStreakLabel: "Rappels de série",
    setNotifStreakDesc: "Un rappel quotidien pour entretenir votre élan",
    setNotifAcademyLabel: "Progression de l'Académie",
    setNotifAcademyDesc: "Quand un nouveau module se débloque ou que vous en terminez un",
    setNotifIntelligenceLabel: "Flux d'intelligence",
    setNotifIntelligenceDesc: "Nouvelles actualités du secteur du luxe disponibles",
    setNotifMentorLabel: "Sessions avec le mentor",
    setNotifMentorDesc: "Rappels pour échanger avec votre mentor IA",
    setNotifSystemLabel: "Système et annonces",
    setNotifSystemDesc: "Mises à jour de la plateforme et alertes importantes",
    setRecent: "RÉCENT",
    setMarkAllRead: "Tout marquer comme lu",
    setNoNotifications: "Aucune notification pour le moment",
    setTimeJustNow: "à l'instant",
    setTimeMinAgo: (m) => `il y a ${m} min`,
    setTimeHourAgo: (h) => `il y a ${h} h`,
    setTimeDayAgo: (d) => `il y a ${d} j`,
    setPrivacyTitle: "Confidentialité",
    setPrivacyDesc: "Vos données, vos accords juridiques, et votre droit de partir.",
    setLegalTitle: "Juridique",
    setViewTerms: "Conditions d'utilisation",
    setViewPrivacyPolicy: "Politique de confidentialité",
    setExportDataTitle: "Exporter vos données",
    setExportDataDesc: "Téléchargez tout ce qu'Aurum OS possède sur votre compte — profil, feuille de route, historique de contenu, tâches et plus — au format JSON.",
    setExportDataButton: "Exporter mes données",
    setExportDataSuccessToast: "Le téléchargement de vos données a commencé.",
    setExportDataFailedToast: "Impossible d'exporter vos données. Veuillez réessayer.",
    setDeleteAccountTitle: "Supprimer le compte",
    setDeleteAccountDesc: "Supprimez définitivement votre compte et toutes les données associées. Cette action est irréversible.",
    setDeleteAccountButton: "Supprimer mon compte",
    setDeleteAccountWarning: "Cette action supprime définitivement votre compte, annule tout abonnement actif et efface toutes vos données — feuille de route, historique de contenu, tâches, conversations avec le mentor, tout. Il n'y a pas de retour en arrière. Tapez DELETE pour confirmer.",
    setDeleteAccountTypePlaceholder: "Tapez DELETE pour confirmer",
    setDeleteAccountConfirm: "Supprimer définitivement mon compte",
    setDeleteAccountFailedToast: "Impossible de supprimer votre compte. Réessayez ou contactez le support.",
    setCancel: "Annuler",
    setBillingTitle: "Facturation",
    setBillingDesc: "Gérez votre abonnement, votre moyen de paiement et l'historique de facturation.",
    setCurrentPlan: "Abonnement actuel",
    setPlanFree: "Gratuit",
    setPlanPro: "Pro",
    setManageBilling: "Gérer la facturation",
    setUpgradeToPro: "Passer à Pro — 29 £/mois",
    setBillingPortalFailedToast: "Impossible d'ouvrir le portail de facturation. Veuillez réessayer.",
    setPastDueWarning: "Votre dernier paiement a échoué — mettez à jour votre moyen de paiement pour conserver l'accès Pro.",
    setTrialingNote: "Vous êtes en période d'essai.",
    setCanceledNote: "Votre abonnement a été annulé.",
    setAccessUntil: (date) => `Accès Pro jusqu'au ${date}, puis votre compte repasse en Gratuit.`,
    setRenewsOn: (date) => `Renouvellement le ${date}.`,
    setFreeUsageTitle: "Utilisation du plan gratuit",
    setUsageStudioDrafts: "Brouillons Content Studio",
    setUsageNetworkDrafts: "Brouillons de messages réseau",
    setUsageMentorMessages: "Messages au mentor",
    setUsageTutorMessages: "Messages au tuteur",
    setUsageRoadmapHelp: "Aide sur les tâches de la feuille de route",
    setDangerTitle: "Zone de danger",
    setDangerDesc: "Actions irréversibles. Procédez avec prudence.",
    setSignOut: "Se déconnecter",
    setSignOutDesc: "Se déconnecter de cet appareil",
    setSignOutAll: "Se déconnecter partout",
    setSignOutAllDesc: "Se déconnecter de tous les appareils et sessions",
    // Page intro overlays
    introEyebrow: "POUR COMMENCER",
    introEnterCta: "Entrer",
    introDontShowAgain: "Ne plus afficher",
    introDashboardDesc: "Votre base quotidienne — le rituel du jour, votre secteur actif, et les événements qui déterminent quoi publier ensuite, en un coup d'œil.",
    introDashboardFeatures: [
      "Rituel quotidien avec des tâches adaptées à votre mode",
      "Progression de l'Académie en un coup d'œil",
      "Événements du secteur avec compte à rebours de préparation de contenu",
      "Accès direct au Mentor et à l'Intelligence",
    ],
    introRoadmapDesc: "Un plan d'entrée personnalisé sur 30 jours, construit autour de votre secteur, niveau et objectifs — des actions quotidiennes précises à cocher au fur et à mesure.",
    introRoadmapFeatures: [
      "Plan semaine par semaine adapté à votre parcours et à votre temps disponible",
      "Tâches quotidiennes générées pour votre situation exacte",
      "Aide IA par tâche dès que vous êtes bloqué",
      "La progression alimente directement votre rituel quotidien",
    ],
    introIntelligenceDesc: "Le signal sous le bruit — un flux en direct d'actualités et de mouvements de votre secteur, actualisé en continu.",
    introIntelligenceFeatures: [
      "Flux en temps réel filtré selon votre secteur",
      "Génération de contenu en un clic depuis chaque actualité",
      "Briefs complets sans quitter la page",
      "Catégorisé pour ne voir que ce qui est pertinent",
    ],
    introMentorDesc: "Une conversation ouverte avec AURUM sur vos choix de carrière, vos décisions et votre positionnement — le contexte est conservé d'une session à l'autre.",
    introMentorFeatures: [
      "Historique des conversations sauvegardé — reprenez où vous en étiez",
      "Comprend votre secteur, votre niveau et votre focus actuel",
      "Suggestions de questions pour débloquer une conversation",
      "Personnalisé selon votre série et vos objectifs",
    ],
    introAcademyDesc: "Devenez un initié, méthodiquement — des modules structurés qui vous font passer d'outsider à quelqu'un qui maîtrise son secteur.",
    introAcademyFeatures: [
      "Modules et leçons spécifiques à votre parcours",
      "Mises en situation et exercices pratiques, pas seulement de la lecture",
      "Progression suivie module par module",
      "Construit autour de vrais scénarios d'entrée dans le métier",
    ],
    introTutorDesc: "Des leçons pas à pas adaptées à votre parcours exact, avec des questions de suivi dès que vous êtes bloqué.",
    introTutorFeatures: [
      "Explications structurées et adaptées au parcours",
      "Questions de suivi illimitées",
      "Historique des leçons sauvegardé",
      "Personnalisé selon votre parcours et votre secteur",
    ],
    introStudioDesc: "Le directeur créatif IA d'AURUM crée du contenu prêt à publier pour votre secteur — accroches, légendes, scripts, hashtags et visuels en moins de 30 secondes.",
    introStudioFeatures: [
      "Légendes et accroches adaptées à chaque plateforme",
      "Scripts complets avec un déroulé plan par plan",
      "Jeux de hashtags adaptés à votre secteur",
      "Signaux en direct pour baser le contenu sur les tendances du moment",
    ],
    introCalendarDesc: "Un registre vivant de vos rituels quotidiens et un espace pour planifier la suite — complétions, séries et tâches avec rappels, le tout sur une seule grille.",
    introCalendarFeatures: [
      "Suivi visuel des séries et des complétions",
      "Tâches avec échéances et rappels",
      "Événements du secteur superposés au même calendrier",
      "Événements communautaires partagés par d'autres membres",
    ],
    introNetworkDesc: "La pièce dans laquelle vous êtes déjà — gérez vos contacts, rédigez des messages sur-mesure pour chaque catégorie, et suivez chaque message envoyé.",
    introNetworkFeatures: [
      "Liste de contacts organisée par catégorie",
      "Messages de prospection rédigés par IA et personnalisés",
      "Suivi des messages envoyés pour ne rien laisser filer",
      "Espace communautaire pour échanger avec d'autres membres",
    ],
    introProfileDesc: "Votre dossier — le profil qu'AURUM utilise pour personnaliser chaque recommandation, ainsi que votre AURUM Score et vos comptes connectés.",
    introProfileFeatures: [
      "Profil modifiable qui façonne les recommandations de l'IA",
      "Détail de votre AURUM Score",
      "Comptes sociaux et plateformes connectés",
      "Votre historique — série, complétions et parcours",
    ],
    celebrationStreakTitle: (n) => n === 1 ? "Série de 1 jour" : `Série de ${n} jours`,
    celebrationStreakSubtitle: "Continuez sur votre lancée.",
    celebrationModuleTitle: "Module terminé",
    celebrationPhaseTitle: (phase) => `Phase terminée — ${phase}`,
    celebrationTrackTitle: (trackName) => `${trackName} terminé`,
    celebrationTrackSubtitle: "Vous avez terminé tout le programme.",
  },
};
