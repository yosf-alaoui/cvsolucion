import { useEffect, useRef } from "react";

type HeroFiberGlowProps = {
  className?: string;
};

type Fiber = {
  cx: number;
  cy: number;
  baseAngle: number;
  len: number;
  tipX: number;
  tipY: number;
  velX: number;
  velY: number;
  opacity: number;
  w1: { freq: number; amp: number; phase: number };
  w2: { freq: number; amp: number; phase: number };
  w3: { freq: number; amp: number; phase: number };
};

export default function HeroFiberGlow({ className = "" }: HeroFiberGlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;
    const canvasEl = canvas;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let fibers: Fiber[] = [];
    const mouse = { x: -9999, y: -9999 };

    const FIBER_COUNT = 180;
    const REPEL = 130;
    const FORCE = 1.1;
    const SPRING = 0.008;
    const DAMP = 0.94;
    let tick = 0;

    function buildFibers() {
      fibers = [];
      const cx = width * 0.5;
      const cy = height * 0.9;

      for (let index = 0; index < FIBER_COUNT; index += 1) {
        const angle = Math.PI + Math.random() * Math.PI;
        const len = 90 + Math.random() * 270;
        fibers.push({
          cx,
          cy,
          baseAngle: angle,
          len,
          tipX: 0,
          tipY: 0,
          velX: 0,
          velY: 0,
          opacity: 0.4 + Math.random() * 0.6,
          w1: {
            freq: 0.004 + Math.random() * 0.006,
            amp: 0.06 + Math.random() * 0.1,
            phase: Math.random() * Math.PI * 2,
          },
          w2: {
            freq: 0.007 + Math.random() * 0.01,
            amp: 0.03 + Math.random() * 0.06,
            phase: Math.random() * Math.PI * 2,
          },
          w3: {
            freq: 0.0015 + Math.random() * 0.003,
            amp: 0.04 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
          },
        });
      }
    }

    function resize() {
      const parent = canvasEl.parentElement;
      if (!parent) return;

      width = parent.clientWidth;
      height = parent.clientHeight;
      const ratio = window.devicePixelRatio || 1;

      canvasEl.width = Math.max(1, Math.floor(width * ratio));
      canvasEl.height = Math.max(1, Math.floor(height * ratio));
      canvasEl.style.width = `${width}px`;
      canvasEl.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      buildFibers();
    }

    function updatePointer(clientX: number, clientY: number) {
      const rect = canvasEl.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
    }

    function clearPointer() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function draw() {
      tick += 1;
      ctx.clearRect(0, 0, width, height);

      fibers.forEach((fiber) => {
        const drift =
          Math.sin(tick * fiber.w1.freq + fiber.w1.phase) * fiber.w1.amp +
          Math.sin(tick * fiber.w2.freq + fiber.w2.phase) * fiber.w2.amp +
          Math.sin(tick * fiber.w3.freq + fiber.w3.phase) * fiber.w3.amp;

        const nextAngle = fiber.baseAngle + drift;
        const nextX = fiber.cx + Math.cos(nextAngle) * fiber.len;
        const nextY = fiber.cy + Math.sin(nextAngle) * fiber.len;
        const dx = nextX - mouse.x;
        const dy = nextY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = nextX;
        let targetY = nextY;

        if (dist < REPEL && dist > 0.5) {
          const pull = (REPEL - dist) / REPEL;
          targetX += (dx / dist) * pull * REPEL * FORCE;
          targetY += (dy / dist) * pull * REPEL * FORCE;
        }

        if (fiber.tipX === 0 && fiber.tipY === 0) {
          fiber.tipX = nextX;
          fiber.tipY = nextY;
        }

        fiber.velX = (fiber.velX + (targetX - fiber.tipX) * SPRING) * DAMP;
        fiber.velY = (fiber.velY + (targetY - fiber.tipY) * SPRING) * DAMP;
        fiber.tipX += fiber.velX;
        fiber.tipY += fiber.velY;

        const midX = (fiber.cx + fiber.tipX) * 0.5 + Math.sin(tick * fiber.w2.freq * 1.3 + fiber.w2.phase) * 18;
        const midY = (fiber.cy + fiber.tipY) * 0.5 + Math.cos(tick * fiber.w1.freq * 1.7 + fiber.w1.phase) * 12;

        const gradient = ctx.createLinearGradient(fiber.cx, fiber.cy, fiber.tipX, fiber.tipY);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.45, `rgba(190,205,255,${fiber.opacity * 0.35})`);
        gradient.addColorStop(1, `rgba(255,255,255,${fiber.opacity})`);

        ctx.beginPath();
        ctx.moveTo(fiber.cx, fiber.cy);
        ctx.quadraticCurveTo(midX, midY, fiber.tipX, fiber.tipY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(fiber.tipX, fiber.tipY, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fiber.opacity})`;
        ctx.fill();
      });

      const originX = width * 0.5;
      const originY = height * 0.9;

      const glowBig = ctx.createRadialGradient(originX, originY, 0, originX, originY, 280);
      glowBig.addColorStop(0, "rgba(200,210,255,0.13)");
      glowBig.addColorStop(0.4, "rgba(180,190,255,0.06)");
      glowBig.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(originX, originY, 280, 0, Math.PI * 2);
      ctx.fillStyle = glowBig;
      ctx.fill();

      const glowCore = ctx.createRadialGradient(originX, originY, 0, originX, originY, 30);
      glowCore.addColorStop(0, "rgba(255,255,255,0.25)");
      glowCore.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(originX, originY, 30, 0, Math.PI * 2);
      ctx.fillStyle = glowCore;
      ctx.fill();

      animationFrame = window.requestAnimationFrame(draw);
    }

    function handleMouseMove(event: MouseEvent) {
      updatePointer(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
      if (!event.touches[0]) return;
      updatePointer(event.touches[0].clientX, event.touches[0].clientY);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    canvasEl.addEventListener("mousemove", handleMouseMove);
    canvasEl.addEventListener("mouseleave", clearPointer);
    canvasEl.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvasEl.addEventListener("touchend", clearPointer);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvasEl.removeEventListener("mousemove", handleMouseMove);
      canvasEl.removeEventListener("mouseleave", clearPointer);
      canvasEl.removeEventListener("touchmove", handleTouchMove);
      canvasEl.removeEventListener("touchend", clearPointer);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
