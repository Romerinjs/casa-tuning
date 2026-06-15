export default function AuthenticatedLoading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F7F8] p-8 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between h-8">
        <div className="h-6 w-48 bg-zinc-200 rounded-md" />
        <div className="h-8 w-36 bg-zinc-200 rounded-md" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs relative overflow-hidden h-28 flex flex-col justify-between">
            <div className="h-3.5 w-24 bg-zinc-100 rounded" />
            <div className="h-8 w-16 bg-zinc-200 rounded mt-2" />
            <div className="h-3 w-32 bg-zinc-100 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Main panel row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* Table skeleton */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs lg:col-span-2 overflow-hidden flex flex-col p-5 space-y-4">
          <div className="h-5 w-36 bg-zinc-200 rounded-md" />
          <div className="space-y-3 flex-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-16 bg-zinc-200 rounded" />
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-zinc-200 rounded" />
                    <div className="h-3.5 w-24 bg-zinc-100 rounded" />
                  </div>
                </div>
                <div className="h-6 w-20 bg-zinc-200 rounded-full" />
                <div className="h-4 w-12 bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar activity skeleton */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex flex-col p-5 space-y-4">
          <div className="h-5 w-36 bg-zinc-200 rounded-md" />
          <div className="space-y-4 mt-4 flex-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-lg bg-zinc-100 border border-zinc-200" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-full bg-zinc-200 rounded" />
                  <div className="h-3 w-16 bg-zinc-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
