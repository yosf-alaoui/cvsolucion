import { useEffect, useRef } from "react";

const wavePaths = [
  {
    d: "M-180 160 C 80 40 260 260 520 138 S 940 96 1180 210 1440 278 1720 120",
    color: "#1d3278",
    opacity: 0.34,
    width: 2.1,
    dash: "1 14",
  },
  {
    d: "M-220 320 C 80 230 280 410 540 292 S 980 232 1230 352 1480 456 1780 284",
    color: "#3154b4",
    opacity: 0.26,
    width: 1.9,
    dash: "1 16",
  },
  {
    d: "M-160 500 C 150 370 330 610 620 474 S 1060 394 1320 534 1510 632 1780 462",
    color: "#10b981",
    opacity: 0.18,
    width: 1.8,
    dash: "1 18",
  },
  {
    d: "M-260 690 C 60 560 350 760 640 632 S 1030 560 1320 706 1530 806 1860 626",
    color: "#23408f",
    opacity: 0.18,
    width: 1.7,
    dash: "1 18",
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function DotWaveBackground() {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<SVGSVGElement | null>(null);
  const glowRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let lastScrollY = window.scrollY;

    const resetTransforms = () => {
      if (gridRef.current) {
        gridRef.current.style.transform = "";
      }
      if (waveRef.current) {
        waveRef.current.style.transform = "";
      }
      if (glowRef.current) {
        glowRef.current.style.transform = "";
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

      const waveRotateX = 2.4 + progress * 6.2 + directionTilt * 1.9;
      const waveRotateY = Math.sin(scrollY / 520) * 4.2;
      const waveTranslateX = Math.sin(scrollY / 460) * 14;
      const waveTranslateY = -Math.min(scrollY * 0.04, 52);
      const gridTranslateY = -Math.min(scrollY * 0.018, 28);
      const glowTranslateY = -Math.min(scrollY * 0.026, 38);

      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(0, ${gridTranslateY}px, 0) scale(1.025)`;
      }

      if (waveRef.current) {
        waveRef.current.style.transform = [
          "perspective(1200px)",
          `translate3d(${waveTranslateX}px, ${waveTranslateY}px, 36px)`,
          `rotateX(${waveRotateX.toFixed(3)}deg)`,
          `rotateY(${waveRotateY.toFixed(3)}deg)`,
          "scale(1.065)",
        ].join(" ");
      }

      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(0, ${glowTranslateY}px, 18px) scale(1.04)`;
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
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9ff_48%,#ffffff_100%)]" />
      <div
        ref={gridRef}
        className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_1px_1px,rgba(35,64,143,0.12)_1px,transparent_0)] [background-position:center_top] [background-size:22px_22px] will-change-transform md:opacity-65 md:[background-size:26px_26px]"
      />

      <svg
        ref={waveRef}
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 920"
        preserveAspectRatio="xMidYMin slice"
        role="presentation"
        style={{
          transformOrigin: "50% 42%",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <defs>
          <linearGradient id="dot-wave-fade" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="14%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="86%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id="dot-wave-mask">
            <rect width="1600" height="920" fill="url(#dot-wave-fade)" />
          </mask>
        </defs>

        <g mask="url(#dot-wave-mask)">
          {wavePaths.map((wave) => (
            <path
              key={wave.d}
              d={wave.d}
              fill="none"
              stroke={wave.color}
              strokeDasharray={wave.dash}
              strokeLinecap="round"
              strokeOpacity={wave.opacity}
              strokeWidth={wave.width}
            />
          ))}

          <g ref={glowRef} style={{ transformOrigin: "50% 50%", willChange: "transform" }}>
            <path
              d="M-180 226 C 80 114 300 330 560 214 S 980 158 1220 286 1480 382 1780 202"
              fill="none"
              stroke="#1d3278"
              strokeLinecap="round"
              strokeOpacity="0.045"
              strokeWidth="64"
            />
            <path
              d="M-220 548 C 120 414 390 658 700 512 S 1110 446 1390 612 1600 694 1880 528"
              fill="none"
              stroke="#10b981"
              strokeLinecap="round"
              strokeOpacity="0.035"
              strokeWidth="72"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
