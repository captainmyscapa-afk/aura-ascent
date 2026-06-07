import { useIndustry } from "@/lib/industry/IndustryProvider";

export function AmbientBackdrop() {
  const { industry } = useIndustry();
  return (
    <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">

      {/* 1 — Base dark gradient (bottom of stack) */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, var(--ambient-2) 0%, oklch(0.08 0.005 240) 100%)",
        }}
      />

      {/* 2 — Industry photo on top of base */}
      <img
        key={industry.id}
        src={industry.ambientImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.18] animate-fade-up"
        style={{ transition: "opacity 900ms ease" }}
      />

      {/* 3 — Primary colour glow — top centre, slowly breathes */}
      <div
        className="absolute inset-0 ambient-glow-top"
        style={{
          background:
            "radial-gradient(ellipse 90% 65% at 50% -10%, var(--ambient-1) 0%, transparent 68%)",
        }}
      />

      {/* 4 — Secondary accent — bottom-left */}
      <div
        className="absolute inset-0 ambient-glow-secondary"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 95%, var(--ambient-accent) 0%, transparent 65%)",
        }}
      />

      {/* 5 — Right-side accent */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 95% 30%, var(--ambient-accent) 0%, transparent 60%)",
          animation: "glow-drift-secondary 15s ease-in-out infinite reverse",
        }}
      />

      {/* 6 — Noise grain (top of stack for texture) */}
      <div className="absolute inset-0 ambient-noise" />

      <style>{`
        @keyframes glow-drift {
          0%   { opacity: 0.7;  transform: translateY(0px) scale(1); }
          50%  { opacity: 1;    transform: translateY(-20px) scale(1.05); }
          100% { opacity: 0.7;  transform: translateY(0px) scale(1); }
        }
        @keyframes glow-drift-secondary {
          0%   { opacity: 0.5; transform: translate(0px, 0px); }
          50%  { opacity: 0.9; transform: translate(14px, -12px); }
          100% { opacity: 0.5; transform: translate(0px, 0px); }
        }
        .ambient-glow-top {
          animation: glow-drift 9s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .ambient-glow-secondary {
          animation: glow-drift-secondary 12s ease-in-out infinite;
          will-change: transform, opacity;
        }
        .ambient-noise {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.045'/></svg>");
          background-repeat: repeat;
          background-size: 180px 180px;
          opacity: 0.5;
          mix-blend-mode: overlay;
        }
      `}</style>
    </div>
  );
}
