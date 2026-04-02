import { CSSProperties, useEffect, useRef } from "react";

type HeroFiberGlowProps = {
  className?: string;
  style?: CSSProperties;
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

export default function HeroFiberGlow({ className = "", style }: HeroFiberGlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sectionRef.current = canvas.closest("section");

    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;
    const canvasEl = canvas;

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let fibers: Fiber[] = [];
    const mouse = { x: -9999, y: -9999 };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const narrowViewport = window.innerWidth < 1280;
    const deviceMemory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0);
    const cpuCores = Number(navigator.hardwareConcurrency || 0);
    const isLowPower =
      reduceMotion ||
      coarsePointer ||
      narrowViewport ||
      (deviceMemory > 0 && deviceMemory <= 8) ||
      (cpuCores > 0 && cpuCores <= 6);
    let isVisible = true;
    let isTabVisible = document.visibilityState === "visible";
    let pointerActive = false;
    let fiberCount = 0;
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 1000 / 24;
    const REPEL = 90;
    const FORCE = 0.28;
    const SPRING = 0.011;
    const DAMP = 0.9;
    let tick = 0;

    function buildFibers() {
      fibers = [];
      const cx = width * 0.5;
      const cy = height * 0.95;
      fiberCount = width >= 1700 && !isLowPower ? 72 : width >= 1400 && !isLowPower ? 56 : 0;

      if (!fiberCount) {
        return;
      }

      for (let index = 0; index < fiberCount; index += 1) {
        const angle = Math.PI + Math.random() * Math.PI;
        const len = 160 + Math.random() * 220;
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
            amp: 0.08 + Math.random() * 0.12,
            phase: Math.random() * Math.PI * 2,
          },
          w2: {
            freq: 0.007 + Math.random() * 0.01,
            amp: 0.05 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
          },
          w3: {
            freq: 0.0015 + Math.random() * 0.003,
            amp: 0.06 + Math.random() * 0.1,
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
      const ratio = Math.min(window.devicePixelRatio || 1, isLowPower ? 1 : 1.2);

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
      pointerActive = false;
    }

    function drawFrame() {
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
        const dist = pointerActive ? Math.sqrt(dx * dx + dy * dy) : REPEL + 1;

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

        const midX = (fiber.cx + fiber.tipX) * 0.5 + Math.sin(tick * fiber.w2.freq * 1.3 + fiber.w2.phase) * 28;
        const midY = (fiber.cy + fiber.tipY) * 0.5 + Math.cos(tick * fiber.w1.freq * 1.7 + fiber.w1.phase) * 18;

        const gradient = ctx.createLinearGradient(fiber.cx, fiber.cy, fiber.tipX, fiber.tipY);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.35, `rgba(190,205,255,${fiber.opacity * (isLowPower ? 0.18 : 0.24)})`);
        gradient.addColorStop(1, `rgba(255,255,255,${fiber.opacity})`);

        ctx.beginPath();
        ctx.moveTo(fiber.cx, fiber.cy);
        ctx.quadraticCurveTo(midX, midY, fiber.tipX, fiber.tipY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = isLowPower ? 1.05 : 1.15;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(fiber.tipX, fiber.tipY, isLowPower ? 2.4 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fiber.opacity})`;
        ctx.fill();
      });

      const originX = width * 0.5;
      const originY = height * 0.9;

      const glowBig = ctx.createRadialGradient(originX, originY, 0, originX, originY, isLowPower ? 250 : 300);
      glowBig.addColorStop(0, "rgba(200,210,255,0.14)");
      glowBig.addColorStop(0.4, "rgba(180,190,255,0.05)");
      glowBig.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(originX, originY, isLowPower ? 250 : 300, 0, Math.PI * 2);
      ctx.fillStyle = glowBig;
      ctx.fill();

      const glowCore = ctx.createRadialGradient(originX, originY, 0, originX, originY, 42);
      glowCore.addColorStop(0, "rgba(255,255,255,0.32)");
      glowCore.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(originX, originY, 42, 0, Math.PI * 2);
      ctx.fillStyle = glowCore;
      ctx.fill();

    }

    function shouldAnimate() {
      return fiberCount > 0 && isVisible && isTabVisible;
    }

    function draw(now: number) {
      if (shouldAnimate() && now - lastFrameTime >= FRAME_INTERVAL) {
        lastFrameTime = now;
        drawFrame();
      }

      animationFrame = window.requestAnimationFrame(draw);
    }

    function handleMouseMove(event: MouseEvent) {
      pointerActive = true;
      updatePointer(event.clientX, event.clientY);
    }

    function handleTouchMove(event: TouchEvent) {
      if (!event.touches[0]) return;
      pointerActive = true;
      updatePointer(event.touches[0].clientX, event.touches[0].clientY);
    }

    function handleVisibilityChange() {
      isTabVisible = document.visibilityState === "visible";
      if (!isTabVisible) {
        clearPointer();
      }
    }

    resize();

    if (!fiberCount) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true;
        if (!isVisible) {
          clearPointer();
        }
      },
      { threshold: 0.08 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    animationFrame = window.requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    canvasEl.addEventListener("pointermove", handleMouseMove, { passive: true });
    canvasEl.addEventListener("mouseleave", clearPointer);
    canvasEl.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvasEl.addEventListener("touchend", clearPointer);
    sectionRef.current?.addEventListener("mouseleave", clearPointer);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      canvasEl.removeEventListener("pointermove", handleMouseMove);
      canvasEl.removeEventListener("mouseleave", clearPointer);
      canvasEl.removeEventListener("touchmove", handleTouchMove);
      canvasEl.removeEventListener("touchend", clearPointer);
      sectionRef.current?.removeEventListener("mouseleave", clearPointer);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} style={style} aria-hidden="true" />;
}
