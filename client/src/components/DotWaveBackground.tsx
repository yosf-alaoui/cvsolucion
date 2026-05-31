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

const cabinetPanels = [
  { x: 96, y: 184, width: 172, height: 106, rotate: -7, accent: "#1d3278", opacity: 0.18 },
  { x: 1246, y: 150, width: 214, height: 132, rotate: 6, accent: "#10b981", opacity: 0.14 },
  { x: 230, y: 612, width: 248, height: 138, rotate: 5, accent: "#3154b4", opacity: 0.14 },
  { x: 1148, y: 588, width: 278, height: 152, rotate: -5, accent: "#23408f", opacity: 0.15 },
];

const cabinetRuns = [
  { x: 610, y: 190, scale: 0.82, rotate: -4, opacity: 0.16 },
  { x: 778, y: 615, scale: 1, rotate: 3, opacity: 0.14 },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function DotWaveBackground() {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<SVGSVGElement | null>(null);
  const productionRef = useRef<SVGGElement | null>(null);
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
      if (productionRef.current) {
        productionRef.current.style.transform = "";
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
      const productionRotateY = Math.sin(scrollY / 620) * -3.4;
      const productionTranslateY = -Math.min(scrollY * 0.032, 44);
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

      if (productionRef.current) {
        productionRef.current.style.transform = [
          `translate3d(${(-waveTranslateX * 0.55).toFixed(2)}px, ${productionTranslateY}px, 58px)`,
          `rotateX(${(waveRotateX * 0.55).toFixed(3)}deg)`,
          `rotateY(${productionRotateY.toFixed(3)}deg)`,
          "scale(1.025)",
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
          <marker
            id="production-arrow"
            markerHeight="6"
            markerWidth="6"
            orient="auto"
            refX="5"
            refY="3"
            viewBox="0 0 6 6"
          >
            <path d="M0 0 L6 3 L0 6 Z" fill="#10b981" fillOpacity="0.22" />
          </marker>
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

          <g
            ref={productionRef}
            style={{
              transformOrigin: "50% 50%",
              transformBox: "fill-box",
              willChange: "transform",
            }}
          >
            <path
              d="M168 462 C 346 392 460 504 606 450 S 906 328 1108 424 1352 534 1512 456"
              fill="none"
              markerEnd="url(#production-arrow)"
              stroke="#10b981"
              strokeDasharray="10 18"
              strokeLinecap="round"
              strokeOpacity="0.18"
              strokeWidth="2"
            />
            <path
              d="M182 510 H 426 C 496 510 518 552 586 552 H 956 C 1030 552 1066 508 1148 508 H 1430"
              fill="none"
              stroke="#1d3278"
              strokeDasharray="2 16"
              strokeLinecap="round"
              strokeOpacity="0.16"
              strokeWidth="2.2"
            />

            {cabinetPanels.map((panel) => (
              <g
                key={`${panel.x}-${panel.y}`}
                opacity={panel.opacity}
                transform={`translate(${panel.x} ${panel.y}) rotate(${panel.rotate})`}
              >
                <rect
                  width={panel.width}
                  height={panel.height}
                  rx="6"
                  fill="#ffffff"
                  fillOpacity="0.62"
                  stroke={panel.accent}
                  strokeWidth="1.8"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={`M18 20 H ${panel.width - 18} M18 ${panel.height - 20} H ${panel.width - 18}`}
                  fill="none"
                  stroke={panel.accent}
                  strokeLinecap="round"
                  strokeOpacity="0.68"
                  strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={`M34 20 V ${panel.height - 20} M ${panel.width - 34} 20 V ${panel.height - 20}`}
                  fill="none"
                  stroke={panel.accent}
                  strokeDasharray="4 9"
                  strokeLinecap="round"
                  strokeOpacity="0.46"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx={panel.width * 0.5} cy={panel.height * 0.5} fill={panel.accent} fillOpacity="0.34" r="3" />
              </g>
            ))}

            {cabinetRuns.map((run) => (
              <g
                key={`${run.x}-${run.y}`}
                opacity={run.opacity}
                transform={`translate(${run.x} ${run.y}) rotate(${run.rotate}) scale(${run.scale})`}
              >
                <path
                  d="M24 28 H306 L350 68 H62 Z"
                  fill="#ffffff"
                  fillOpacity="0.58"
                  stroke="#23408f"
                  strokeLinejoin="round"
                  strokeWidth="1.7"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="62"
                  y="68"
                  width="288"
                  height="132"
                  rx="5"
                  fill="#ffffff"
                  fillOpacity="0.48"
                  stroke="#23408f"
                  strokeWidth="1.7"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M134 72 V200 M206 72 V200 M278 72 V200 M78 122 H334 M98 164 H158 M190 164 H250 M282 164 H318"
                  fill="none"
                  stroke="#23408f"
                  strokeLinecap="round"
                  strokeOpacity="0.78"
                  strokeWidth="1.1"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M94 43 H214 M154 43 V20 M154 20 H258"
                  fill="none"
                  stroke="#10b981"
                  strokeDasharray="7 10"
                  strokeLinecap="round"
                  strokeOpacity="0.78"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                <rect
                  x="244"
                  y="8"
                  width="34"
                  height="24"
                  rx="4"
                  fill="#10b981"
                  fillOpacity="0.18"
                  stroke="#10b981"
                  strokeWidth="1.3"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M261 32 V56"
                  fill="none"
                  stroke="#10b981"
                  strokeLinecap="round"
                  strokeOpacity="0.7"
                  strokeWidth="1.3"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </g>

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
