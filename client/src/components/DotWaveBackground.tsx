import siteBackground from "@/assets/site-background.webp";

export default function DotWaveBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f8fbff]" aria-hidden="true">
      <img
        src={siteBackground}
        alt=""
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover opacity-75"
        style={{
          objectPosition: "58% center",
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
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 82% 24%, rgba(29,50,120,0.16), transparent 34%), radial-gradient(circle at 70% 62%, rgba(16,185,129,0.13), transparent 38%)",
        }}
      />
    </div>
  );
}
