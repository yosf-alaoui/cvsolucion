export default function DotWaveBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(49,84,180,0.14),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_54%,#ffffff_100%)] md:bg-[radial-gradient(circle_at_top_left,rgba(49,84,180,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f7f9ff_44%,#ffffff_100%)]" />

      <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(35,64,143,0.16)_1.4px,transparent_0)] [background-position:center_top] [background-size:18px_18px] md:opacity-60 md:[background-image:radial-gradient(circle_at_1px_1px,rgba(35,64,143,0.17)_1.25px,transparent_0)] md:[background-size:24px_24px]" />

      <div className="absolute inset-0 opacity-45 [background-image:radial-gradient(circle_at_1px_1px,rgba(29,50,120,0.2)_1.8px,transparent_0)] [background-position:10px_140px] [background-size:30px_30px] md:opacity-34 md:[background-image:radial-gradient(circle_at_1px_1px,rgba(49,84,180,0.2)_1.8px,transparent_0)] md:[background-position:0_90px] md:[background-size:42px_42px]" />

      <div className="absolute left-[-10%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-[#3154b4]/12 blur-[120px]" />
      <div className="absolute right-[-12%] top-[38%] h-[24rem] w-[24rem] rounded-full bg-emerald-400/10 blur-[120px]" />
      <div className="absolute left-[24%] bottom-[-12%] h-[22rem] w-[22rem] rounded-full bg-[#1d3278]/8 blur-[130px]" />
    </div>
  );
}
