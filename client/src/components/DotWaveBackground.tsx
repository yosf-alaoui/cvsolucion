type Dot = {
  x: number;
  y: number;
  r: number;
  opacity: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createWaveDots(config: {
  width: number;
  height: number;
  rows: number;
  cols: number;
  amplitude: number;
  frequency: number;
  phase: number;
  yOffset: number;
  colorBias?: number;
}) {
  const dots: Dot[] = [];
  const { width, height, rows, cols, amplitude, frequency, phase, yOffset, colorBias = 0 } = config;

  for (let row = 0; row < rows; row += 1) {
    const rowRatio = row / Math.max(1, rows - 1);
    const baseY = yOffset + rowRatio * height;

    for (let col = 0; col < cols; col += 1) {
      const colRatio = col / Math.max(1, cols - 1);
      const x = colRatio * width;
      const wave =
        Math.sin(colRatio * Math.PI * frequency + phase) * amplitude +
        Math.cos(colRatio * Math.PI * (frequency * 0.46) + rowRatio * 2.8 + phase * 0.7) * amplitude * 0.28;
      const y = baseY + wave;

      const envelopeX = Math.sin(colRatio * Math.PI);
      const envelopeY = Math.sin(rowRatio * Math.PI);
      const strength = clamp(envelopeX * envelopeY, 0, 1);
      const radius = 0.65 + strength * 1.3 + colorBias * 0.08;
      const opacity = 0.1 + strength * 0.5;

      dots.push({
        x,
        y,
        r: radius,
        opacity,
      });
    }
  }

  return dots;
}

export default function DotWaveBackground() {
  const width = 1600;
  const height = 980;

  const waveA = createWaveDots({
    width: 1400,
    height: 200,
    rows: 20,
    cols: 110,
    amplitude: 46,
    frequency: 3.4,
    phase: 0.2,
    yOffset: 80,
  });

  const waveB = createWaveDots({
    width: 1180,
    height: 180,
    rows: 18,
    cols: 96,
    amplitude: 34,
    frequency: 2.6,
    phase: 1.3,
    yOffset: 250,
    colorBias: 0.2,
  });

  const waveC = createWaveDots({
    width: 1320,
    height: 190,
    rows: 16,
    cols: 102,
    amplitude: 42,
    frequency: 2.9,
    phase: 2.2,
    yOffset: 540,
    colorBias: -0.08,
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(49,84,180,0.14),transparent_32%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_48%,#ffffff_100%)]" />
      <div className="absolute left-[-8%] top-[14%] h-[28rem] w-[28rem] rounded-full bg-[#3154b4]/14 blur-[120px]" />
      <div className="absolute right-[-10%] top-[36%] h-[26rem] w-[26rem] rounded-full bg-emerald-400/12 blur-[120px]" />
      <div className="absolute left-[26%] bottom-[-12%] h-[24rem] w-[24rem] rounded-full bg-[#1d3278]/10 blur-[130px]" />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMin slice"
        aria-hidden="true"
      >
        <rect width={width} height={height} fill="rgba(255,255,255,0.18)" />

        <g transform="translate(120 0)">
          {waveA.map((dot, index) => (
            <circle
              key={`a-${index}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill="#1d3278"
              fillOpacity={dot.opacity}
            />
          ))}
        </g>

        <g transform="translate(220 0)">
          {waveB.map((dot, index) => (
            <circle
              key={`b-${index}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill="#3154b4"
              fillOpacity={dot.opacity * 0.85}
            />
          ))}
        </g>

        <g transform="translate(80 0)">
          {waveC.map((dot, index) => (
            <circle
              key={`c-${index}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              fill="#23408f"
              fillOpacity={dot.opacity * 0.72}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
