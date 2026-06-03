import { useEffect, useRef } from "react";
import siteBackground from "@/assets/site-background.webp";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function DotWaveBackground() {
  const backgroundRef = useRef<HTMLImageElement | null>(null);
  const depthTintRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let lastScrollY = window.scrollY;

    const resetTransforms = () => {
      if (backgroundRef.current) {
        backgroundRef.current.style.transform = "";
      }
      if (depthTintRef.current) {
        depthTintRef.current.style.transform = "";
      }
    };

    const update = () => {
      frameId = 0;

      if (reduceMotion.matches) {
        resetTransforms();
        return;
      }

      const scrollY = window.scrollY;
      const scrollDelta = clamp(scrollY - lastScrollY, -48, 48);
      const documentHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp(scrollY / Math.min(documentHeight, 1800), 0, 1);
      const directionTilt = scrollDelta / 48;

      lastScrollY = scrollY;

      const imageTranslateX = Math.sin(scrollY / 720) * 10;
      const imageTranslateY = -Math.min(scrollY * 0.026, 38);
      const imageRotateX = 1.8 + progress * 4.8 + directionTilt * 1.35;
      const imageRotateY = Math.sin(scrollY / 680) * 2.8;
      const imageScale = 1.08 + progress * 0.025;
      const tintTranslateY = -Math.min(scrollY * 0.014, 22);

      if (backgroundRef.current) {
        backgroundRef.current.style.transform = [
          "perspective(1400px)",
          `translate3d(${imageTranslateX.toFixed(2)}px, ${imageTranslateY}px, 0)`,
          `rotateX(${imageRotateX.toFixed(3)}deg)`,
          `rotateY(${imageRotateY.toFixed(3)}deg)`,
          `scale(${imageScale.toFixed(3)})`,
        ].join(" ");
      }

      if (depthTintRef.current) {
        depthTintRef.current.style.transform = `translate3d(0, ${tintTranslateY}px, 0) scale(1.02)`;
      }
    };

    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(update);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reduceMotion.addEventListener("change", scheduleUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reduceMotion.removeEventListener("change", scheduleUpdate);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f8fbff]" aria-hidden="true">
      <img
        ref={backgroundRef}
        src={siteBackground}
        alt=""
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover opacity-75 will-change-transform"
        style={{
          objectPosition: "58% center",
          transformOrigin: "54% 42%",
          transformStyle: "preserve-3d",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 34%, rgba(255,255,255,0.58) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.68) 0%, rgba(255,255,255,0.2) 34%, rgba(255,255,255,0.72) 100%)",
        }}
      />
      <div
        ref={depthTintRef}
        className="absolute inset-0 will-change-transform"
        style={{
          background:
            "radial-gradient(circle at 82% 24%, rgba(29,50,120,0.16), transparent 34%), radial-gradient(circle at 70% 62%, rgba(16,185,129,0.13), transparent 38%)",
        }}
      />
    </div>
  );
}
