import { useIndustry } from "@/lib/industry/IndustryProvider";

export function AmbientBackdrop() {
  const { industry } = useIndustry();
  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 pointer-events-none transition-opacity duration-700"
    >
      <img
        key={industry.id}
        src={industry.ambientImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.10] animate-fade-up"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top, var(--ambient-1, oklch(0.22 0.04 255 / 60%)), transparent 60%), linear-gradient(180deg, var(--ambient-2, oklch(0.13 0.005 240)), oklch(0.1 0.005 240))",
        }}
      />
    </div>
  );
}
