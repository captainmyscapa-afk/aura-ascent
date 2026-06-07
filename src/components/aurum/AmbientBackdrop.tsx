import { useIndustry } from "@/lib/industry/IndustryProvider";

export function AmbientBackdrop() {
  const { industry } = useIndustry();
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none"
    >
      {/* Industry photo — slightly more visible */}
      <img
        key={industry.id}
        src={industry.ambientImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.18] animate-fade-up"
        style={{ transition: "opacity 900ms ease" }}
      />

      {/* Primary ambient glow — top, animated drift */}
      <div
        className="absolute inset-0 ambient-glow-top"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -5%, var(--ambient-1) 0%, transparent 70%)",
        }}
      />

      {/* Secondary glow — bottom-left accent */}
      <div
        className="absolute inset-0 ambient-glow-secondary"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 15% 90%, var(--ambient-accent, oklch(0.3 0.08 255 / 25%)) 0%, transparent 65%)",
        }}
      />

      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--ambient-2) 0%, oklch(0.08 0.005 240) 100%)",
        }}
      />

      {/* Noise grain for depth */}
      <div className="absolute inset-0 ambient-noise" />

      <style>{`
        @keyframes glow-drift {
          0%   { opacity: 0.75; transform: translateY(0px) scale(1); }
          50%  { opacity: 1;    transform: translateY(-18px) scale(1.04); }
          100% { opacity: 0.75; transform: translateY(0px) scale(1); }
        }
        @keyframes glow-drift-secondary {
          0%   { opacity: 0.5; transform: translate(0px, 0px); }
          50%  { opacity: 0.8; transform: translate(12px, -10px); }
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
          opacity: 0.6;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
