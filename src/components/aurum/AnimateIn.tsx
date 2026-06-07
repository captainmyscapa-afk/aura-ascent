import { useEffect, useRef, useState } from "react";

interface AnimateInProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before the animation starts — use for staggering siblings */
  delay?: number;
  /** How far to slide up from (px). Default 24. */
  distance?: number;
  /** 0–1 threshold before triggering. Default 0.08. */
  threshold?: number;
}

/**
 * Wraps children in a div that fades + slides up when it enters the viewport.
 * Only triggers once. Use `delay` to stagger groups of items.
 *
 * <AnimateIn delay={100}><Card /></AnimateIn>
 */
export function AnimateIn({
  children,
  className = "",
  delay = 0,
  distance = 24,
  threshold = 0.08,
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -32px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${distance}px)`,
        filter: visible ? "blur(0)" : "blur(2px)",
        transition: `opacity 0.55s cubic-bezier(0.32,0.72,0,1) ${delay}ms, transform 0.55s cubic-bezier(0.32,0.72,0,1) ${delay}ms, filter 0.45s ease ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
