import { useEffect, useRef } from "react";
import { useIndustry } from "@/lib/industry/IndustryProvider";
import type { IndustryId } from "@/lib/industry/types";

const INDUSTRY_RGB: Record<IndustryId, [number, number, number]> = {
  yachts: [56,  190, 255],
  villas: [30,  120,  65],   // Jaguar British Racing Green
  jets:   [155, 100, 255],
  cars:   [255,  75,  55],
};
const GOLD_RGB: [number, number, number] = [201, 168, 76];

type Shape = "diamond" | "hexagon" | "cross" | "triangle" | "star";

const INDUSTRY_SHAPE: Record<IndustryId, Shape> = {
  yachts: "diamond",
  villas: "hexagon",
  jets:   "cross",
  cars:   "triangle",
};

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  x: number,
  y: number,
  size: number,
  angle: number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();

  switch (shape) {
    case "diamond": {
      const s = size * 1.4;
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.6, 0);
      ctx.closePath();
      break;
    }
    case "hexagon": {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        const px = Math.cos(a) * size;
        const py = Math.sin(a) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case "cross": {
      const arm = size * 1.6;
      const thick = size * 0.35;
      ctx.rect(-arm, -thick, arm * 2, thick * 2);
      ctx.rect(-thick, -arm, thick * 2, arm * 2);
      break;
    }
    case "triangle": {
      const h = size * 1.8;
      ctx.moveTo(0, -h);
      ctx.lineTo(size, h * 0.6);
      ctx.lineTo(-size, h * 0.6);
      ctx.closePath();
      break;
    }
    case "star": {
      // 4-pointed star ✦
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI / 4) * i;
        const r = i % 2 === 0 ? size * 1.6 : size * 0.5;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
  }

  ctx.restore();
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  life: number;
  maxLife: number;
  isGold: boolean;
  angle: number;
  spin: number;
  shape: Shape;
}

function mkParticle(w: number, h: number, shape: Shape, randomY = false): Particle {
  const isGold = Math.random() < 0.18;
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : h + 10,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -(Math.random() * 0.32 + 0.07),
    size: Math.random() * 2 + 1.2,
    baseOpacity: isGold
      ? Math.random() * 0.35 + 0.15
      : Math.random() * 0.28 + 0.10,
    life: 0,
    maxLife: Math.random() * 400 + 280,
    isGold,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.008,
    shape: isGold ? "star" : shape,
  };
}

export function ParticleLayer() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const pRef        = useRef<Particle[]>([]);
  const { industryId } = useIndustry();
  const industryRef = useRef<IndustryId>(industryId);

  useEffect(() => { industryRef.current = industryId; }, [industryId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 55;
    const getShape = () => INDUSTRY_SHAPE[industryRef.current] ?? "diamond";
    pRef.current = Array.from({ length: COUNT }, () =>
      mkParticle(canvas.width, canvas.height, getShape(), true)
    );

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const shape = getShape();
      const [ir, ig, ib] = INDUSTRY_RGB[industryRef.current] ?? GOLD_RGB;

      for (const p of pRef.current) {
        p.x += p.vx + Math.sin(p.life * 0.014) * 0.1;
        p.y += p.vy;
        p.angle += p.spin;
        p.life++;

        const t = p.life / p.maxLife;
        const fade = t < 0.12 ? t / 0.12 : t > 0.78 ? (1 - t) / 0.22 : 1;
        const alpha = p.baseOpacity * fade;
        const [r, g, b] = p.isGold ? GOLD_RGB : [ir, ig, ib];

        ctx.save();
        ctx.shadowBlur  = p.isGold ? 8 : 5;
        ctx.shadowColor = `rgba(${r},${g},${b},${alpha * 0.7})`;
        ctx.fillStyle   = `rgba(${r},${g},${b},${alpha})`;

        drawShape(ctx, p.shape, p.x, p.y, p.size, p.angle);
        ctx.fill();
        ctx.restore();

        // Respawn
        if (p.y < -20 || p.x < -20 || p.x > canvas.width + 20 || p.life >= p.maxLife) {
          Object.assign(p, mkParticle(canvas.width, canvas.height, shape, false));
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 15,
        mixBlendMode: "screen",
        opacity: 0.75,
      }}
    />
  );
}
