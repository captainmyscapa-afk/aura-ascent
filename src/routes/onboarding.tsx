import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";
import { Logo } from "@/components/aurum/Logo";
import { INDUSTRY_LIST } from "@/lib/industry/config";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import { useAurumCoreState } from "@/hooks/useAurumCoreState";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const levels = [
  { id: "beginner", name: "Beginner", desc: "Curious, exploring, building foundation" },
  { id: "intermediate", name: "Intermediate", desc: "In the industry, accelerating" },
  { id: "experienced", name: "Experienced", desc: "Established, scaling reach & deals" },
];

const ambitions = [
  "Escape my current career",
  "Become independent",
  "Build a luxury network",
  "Become a broker",
  "Build authority online",
  "Improve confidence",
  "Increase income",
  "Enter elite circles",
  "Build a personal brand",
  "Build a sophisticated lifestyle",
];

// CAP-78: daily ritual onboarding questions
const TIME_BUDGETS = [
  { id: "15min", name: "15 minutes", desc: "Quick daily wins between commitments" },
  { id: "30min", name: "30 minutes", desc: "A focused block before or after work" },
  { id: "1hr", name: "1 hour", desc: "Steady, compounding daily progress" },
  { id: "2hr+", name: "2+ hours", desc: "Going all-in on the transition" },
] as const;

const PREFERRED_TIMES = [
  { id: "morning", name: "Early morning" },
  { id: "midday", name: "During the day" },
  { id: "evening", name: "Evening" },
  { id: "late_night", name: "Late night" },
] as const;

const FOCUS_AREAS = [
  "Networking & relationships",
  "Industry knowledge",
  "Content & visibility",
  "Direct outreach",
  "Confidence & mindset",
];

const CHALLENGES = [
  "I don't know where to start",
  "I lack confidence",
  "I don't have a network yet",
  "I don't have much time",
  "I don't know the industry well enough",
];

function Onboarding() {
  const navigate = useNavigate();
  const { industryId, setIndustry, industry } = useIndustry();
  const { update: updateCore } = useAurumCoreState();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<string | null>(null);
  const [amb, setAmb] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  // CAP-78: daily ritual onboarding answers
  const [timeBudget, setTimeBudget] = useState<string | null>(null);
  const [preferredTime, setPreferredTime] = useState<string | null>(null);
  const [background, setBackground] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<string | null>(null);

  const totalSteps = 9;

  async function next() {
    if (step === totalSteps - 1) {
      setGenerating(true);
      await updateCore({
        active_mode: industryId,
        current_level: level ?? "beginner",
        ritual_profile: {
          timeBudget: (timeBudget ?? "30min") as "15min" | "30min" | "1hr" | "2hr+",
          preferredTime: (preferredTime ?? "evening") as "morning" | "midday" | "evening" | "late_night",
          background: background.trim(),
          focusAreas,
          biggestChallenge: challenge ?? "",
        },
      });
      setTimeout(() => navigate({ to: "/app" }), 2200);
      return;
    }
    setStep((s) => s + 1);
  }
  function back() {
    if (step === 0) {
      navigate({ to: "/" });
    } else {
      setStep((s) => s - 1);
    }
  }

  const canNext =
    step === 0 ||
    (step === 1 && !!level) ||
    (step === 2 && amb.length > 0) ||
    (step === 3 && !!timeBudget) ||
    (step === 4 && !!preferredTime) ||
    step === 5 ||
    (step === 6 && focusAreas.length > 0) ||
    (step === 7 && !!challenge) ||
    step === 8;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-6">
        <Logo />
        <div className="font-mono text-xs text-muted-foreground tracking-widest">
          {String(step + 1).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
        </div>
      </header>

      <div className="px-6 sm:px-10">
        <div className="h-px w-full bg-border/60 overflow-hidden">
          <div
            className="h-full bg-[var(--gradient-gold)] transition-all duration-700"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <main className="flex-1 px-6 sm:px-10 lg:px-16 py-14 max-w-5xl w-full mx-auto">
        {generating ? (
          <Generating mode={industry.modeLabel} />
        ) : (
          <div key={step} className="animate-fade-up">
            {step === 0 && (
              <StepWrap
                eyebrow="STEP 01 · CHOOSE YOUR WORLD"
                title="Which elite ecosystem are you entering?"
                sub="Your mentor, intelligence feed, daily rituals, networking and content adapt completely to this choice. You can switch modes anytime."
              >
                <div className="grid sm:grid-cols-2 gap-4">
                  {INDUSTRY_LIST.map((opt) => {
                    const Icon = opt.icon;
                    const selected = industryId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setIndustry(opt.id)}
                        className={`text-left p-6 rounded-lg border transition-all glass ${
                          selected
                            ? "border-primary/60 ring-gold"
                            : "border-border hover:border-border/80"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 mb-4 ${
                            selected ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <div className="font-serif text-xl text-foreground">{opt.modeLabel}</div>
                        <div className="mt-1.5 text-sm text-muted-foreground">{opt.tagline}</div>
                      </button>
                    );
                  })}
                </div>
              </StepWrap>
            )}

            {step === 1 && (
              <StepWrap
                eyebrow="STEP 02 · YOUR POSITION"
                title="Where do you stand today?"
                sub="Honest assessment unlocks precise mentorship."
              >
                <div className="space-y-3">
                  {levels.map(({ id, name, desc }) => (
                    <button
                      key={id}
                      onClick={() => setLevel(id)}
                      className={`w-full text-left p-5 rounded-lg border transition-all glass flex items-center gap-5 ${
                        level === id
                          ? "border-primary/60 ring-gold"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-mono ${
                          level === id
                            ? "bg-[var(--gradient-gold)] text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-serif text-lg text-foreground">{name}</div>
                        <div className="text-sm text-muted-foreground">{desc}</div>
                      </div>
                      {level === id && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </StepWrap>
            )}

            {step === 2 && (
              <StepWrap
                eyebrow="STEP 03 · INTENT"
                title="What outcomes are you pursuing?"
                sub="Select all that resonate. We tune your operating system around them."
              >
                <div className="flex flex-wrap gap-2.5">
                  {ambitions.map((a) => {
                    const selected = amb.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() =>
                          setAmb((prev) =>
                            prev.includes(a) ? prev.filter((p) => p !== a) : [...prev, a],
                          )
                        }
                        className={`px-4 py-2.5 rounded-full border text-sm transition-all ${
                          selected
                            ? "bg-[var(--gradient-gold)] text-primary-foreground border-transparent"
                            : "glass text-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </StepWrap>
            )}

            {step === 3 && (
              <StepWrap
                eyebrow="STEP 04 · DAILY RITUAL · 1 OF 5"
                title="How much time can you realistically commit each day?"
                sub="Be honest — your daily rituals will be sized to fit this, so they actually feel doable."
              >
                <div className="space-y-3">
                  {TIME_BUDGETS.map(({ id, name, desc }) => (
                    <button
                      key={id}
                      onClick={() => setTimeBudget(id)}
                      className={`w-full text-left p-5 rounded-lg border transition-all glass flex items-center gap-5 ${
                        timeBudget === id
                          ? "border-primary/60 ring-gold"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-serif text-lg text-foreground">{name}</div>
                        <div className="text-sm text-muted-foreground">{desc}</div>
                      </div>
                      {timeBudget === id && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </StepWrap>
            )}

            {step === 4 && (
              <StepWrap
                eyebrow="STEP 04 · DAILY RITUAL · 2 OF 5"
                title="When do you have the energy to focus on this?"
                sub="We'll frame your daily rituals around the part of the day you're most likely to actually do them."
              >
                <div className="space-y-3">
                  {PREFERRED_TIMES.map(({ id, name }) => (
                    <button
                      key={id}
                      onClick={() => setPreferredTime(id)}
                      className={`w-full text-left p-5 rounded-lg border transition-all glass flex items-center gap-5 ${
                        preferredTime === id
                          ? "border-primary/60 ring-gold"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex-1 font-serif text-lg text-foreground">{name}</div>
                      {preferredTime === id && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </StepWrap>
            )}

            {step === 5 && (
              <StepWrap
                eyebrow="STEP 04 · DAILY RITUAL · 3 OF 5"
                title="Tell us a little about where you're coming from."
                sub="Your current profession, skills or experience — anything that helps us make your rituals feel relevant to your life. Optional, but it helps."
              >
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="e.g. I work in corporate sales and have a strong network on LinkedIn, but I know nothing about yachting yet…"
                  rows={5}
                  className="w-full rounded-lg border border-border glass p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                />
              </StepWrap>
            )}

            {step === 6 && (
              <StepWrap
                eyebrow="STEP 04 · DAILY RITUAL · 4 OF 5"
                title="Where should your daily rituals focus most?"
                sub="Select all that resonate — we'll weight your tasks toward these areas."
              >
                <div className="flex flex-wrap gap-2.5">
                  {FOCUS_AREAS.map((a) => {
                    const selected = focusAreas.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() =>
                          setFocusAreas((prev) =>
                            prev.includes(a) ? prev.filter((p) => p !== a) : [...prev, a],
                          )
                        }
                        className={`px-4 py-2.5 rounded-full border text-sm transition-all ${
                          selected
                            ? "bg-[var(--gradient-gold)] text-primary-foreground border-transparent"
                            : "glass text-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </StepWrap>
            )}

            {step === 7 && (
              <StepWrap
                eyebrow="STEP 04 · DAILY RITUAL · 5 OF 5"
                title="What's holding you back the most right now?"
                sub="No judgment — this just helps us calibrate the kind of support your rituals give you."
              >
                <div className="space-y-3">
                  {CHALLENGES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setChallenge(c)}
                      className={`w-full text-left p-5 rounded-lg border transition-all glass flex items-center gap-5 ${
                        challenge === c
                          ? "border-primary/60 ring-gold"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="flex-1 font-serif text-lg text-foreground">{c}</div>
                      {challenge === c && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </StepWrap>
            )}

            {step === 8 && (
              <StepWrap
                eyebrow="STEP 05 · INITIATION"
                title="Your operating system is ready to be forged."
                sub="On the next screen, AURUM AI will architect your personal 30-day immersion and your daily rituals."
              >
                <div className="glass rounded-xl p-8 space-y-5">
                  <Row label="Ecosystem" value={industry.modeLabel} />
                  <Row label="Level" value={levels.find((l) => l.id === level)?.name ?? "—"} />
                  <Row label="Ambitions" value={`${amb.length} selected`} />
                  <Row label="Daily commitment" value={TIME_BUDGETS.find((t) => t.id === timeBudget)?.name ?? "—"} />
                  <Row label="Ritual focus" value={`${focusAreas.length} selected`} />
                  <div className="hairline" />
                  <p className="text-sm text-muted-foreground italic">
                    "The discipline of taste begins on day one."
                  </p>
                </div>
              </StepWrap>
            )}

            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {step === 0 ? "Home" : "Back"}
              </button>
              <button
                onClick={next}
                disabled={!canNext}
                className="inline-flex items-center gap-3 rounded-full px-7 py-3 text-sm font-medium tracking-wide shadow-[var(--shadow-gold)] disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{
                  background: canNext ? "var(--gradient-gold)" : "rgba(201,168,76,0.3)",
                  color: "#080808",
                }}
              >
                {step === totalSteps - 1 ? "Forge My System" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StepWrap({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.34em] text-primary/80 mb-3">{eyebrow}</div>
      <h1 className="font-serif text-4xl sm:text-5xl leading-tight text-foreground max-w-3xl">
        {title}
      </h1>
      <p className="mt-4 text-muted-foreground max-w-xl">{sub}</p>
      <div className="mt-10">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <div className="text-[10px] tracking-[0.32em] text-muted-foreground">{label}</div>
      <div className="font-serif text-lg text-foreground">{value}</div>
    </div>
  );
}

function Generating({ mode }: { mode: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-up">
      <div className="relative h-20 w-20 mb-8">
        <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-[var(--gradient-gold)] flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
      </div>
      <div className="text-[10px] tracking-[0.4em] text-primary/80 mb-3">AURUM AI</div>
      <h2 className="font-serif text-3xl sm:text-4xl text-foreground max-w-2xl">
        Setting up your personalized {mode} experience…
      </h2>
      <div className="mt-10 space-y-2 text-sm text-muted-foreground font-mono max-w-md w-full text-left">
        {[
          "Mapping ecosystem intelligence feeds",
          "Calibrating 30-day execution roadmap",
          "Selecting networking opportunities",
          "Initializing AI mentor persona",
        ].map((l, i) => (
          <div
            key={l}
            className="flex items-center gap-3 animate-fade-up"
            style={{ animationDelay: `${i * 250}ms` }}
          >
            <Check className="h-3.5 w-3.5 text-primary" />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
