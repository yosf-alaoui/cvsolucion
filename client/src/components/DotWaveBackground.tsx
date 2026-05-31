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

export default function DotWaveBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-white" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9ff_48%,#ffffff_100%)]" />
      <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_1px_1px,rgba(35,64,143,0.12)_1px,transparent_0)] [background-position:center_top] [background-size:22px_22px] md:opacity-65 md:[background-size:26px_26px]" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1600 920"
        preserveAspectRatio="xMidYMin slice"
        role="presentation"
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
      </svg>
    </div>
  );
}
