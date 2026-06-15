export default function RootLoading() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0A0A0C] font-sans antialiased text-white">
      {/* Decorative glows to match the login theme */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
      <div className="absolute -bottom-45 -right-45 h-[650px] w-[650px] rounded-full bg-[#9A7A28]/5 blur-[130px]" />

      <div className="relative flex flex-col items-center gap-4 z-10">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgba(201,168,76,0.15)] animate-pulse">
          <img src="/logo-ct.svg" alt="Casa Tuning Logo" className="h-20 w-20" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1.5">
          <span className="text-sm font-semibold tracking-wider text-white">Cargando Sistema</span>
          <span className="text-xs text-[#9898A6]">Casa Tuning</span>
        </div>
        
        {/* Sleek golden progress line */}
        <div className="mt-6 w-36 h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-[#C9A84C] to-[#9A7A28] rounded-full animate-loading-line" />
        </div>
      </div>
    </div>
  );
}
