"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardFAB() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center group">
      {/* Tooltip speech bubble (bouncing, fades out after 5s or recovers on hover) */}
      <div
        className={`mb-3 animate-tooltip-bounce transition-all duration-500 ease-out relative ${
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        } group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 group-hover:pointer-events-auto`}
      >
        <div className="bg-zinc-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg whitespace-nowrap">
          Registrar vehículo
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-zinc-700 rotate-45" />
      </div>

      {/* Floating Button */}
      <Link
        href="/recepcion"
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFD54F] hover:bg-[#F5C42F] text-[#0A0A0C] transition-all duration-200 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95"
      >
        <Plus className="h-7 w-7 stroke-[3]" />
      </Link>
    </div>
  );
}
