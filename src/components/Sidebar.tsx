"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  Users,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Car,
  Megaphone,
} from "lucide-react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    roleName: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const navItems = [
    {
      label: "Principal",
      items: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        {
          href: "/recepcion",
          label: "Nueva recepción",
          icon: PlusCircle,
        },
        {
          href: "/ordenes",
          label: "Órdenes",
          icon: ClipboardList,
        },
      ],
    },
    {
      label: "Gestión",
      items: [
        ...(user.roleName === "Administrador"
          ? [
            {
              href: "/clientes",
              label: "Clientes",
              icon: Users,
            },
            {
              href: "/vehiculos",
              label: "Vehículos",
              icon: Car,
            },
            {
              href: "/promociones",
              label: "Promociones",
              icon: Megaphone,
            },
            {
              href: "/administracion",
              label: "Administración",
              icon: ShieldAlert,
            },
          ]
          : []),
      ],
    },
  ];

  const renderSidebarContent = (onLinkClick?: () => void) => (
    <div className="flex flex-col h-full bg-[#111113] text-white">
      {/* Brand Logo Section */}
      <div className="p-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFFFFF] to-[#FFFFFF] shadow-[0_4px_12px_rgb(201,168,76,0.15)]">
            <img src="/logo-ct.svg" alt="Casa Tuning Logo" className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              Casa Tuning
            </h1>
            <span className="text-[10px] text-white/40 tracking-wider uppercase font-semibold mt-0.5 block">
              Portal Operativo
            </span>
          </div>
        </div>
        {onLinkClick && (
          <button
            onClick={onLinkClick}
            className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.04]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {navItems
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div key={group.label} className="space-y-2">
              <span className="text-[10px] font-semibold text-white/30 tracking-wider uppercase px-3">
                {group.label}
              </span>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (onLinkClick) onLinkClick();
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                        ? "bg-gradient-to-r from-white/[0.08] to-white/[0.02] text-white border-l-2 border-[#C9A84C] pl-2.5"
                        : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                        }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#C9A84C]" : ""}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </nav>

      {/* User Section & Logout */}
      <div className="p-4 border-t border-white/[0.06] bg-black/20 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#9A7A28] flex items-center justify-center text-[#0A0A0C] font-bold text-xs shrink-0 shadow-sm">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">
                {user.name}
              </h4>
              <p className="text-[10px] text-white/45 truncate">
                {user.roleName}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-white/[0.04] transition-colors shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE HEADER BAR */}
      <div className="lg:hidden h-14 border-b border-white/[0.06] bg-[#111113] flex items-center justify-between px-6 text-white shrink-0 w-full z-30 relative">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#9A7A28]">
            <img src="/logo-ct.svg" alt="Casa Tuning Logo" className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-white leading-none">
              Casa Tuning
            </h1>
            <span className="text-[9px] text-white/30 tracking-wider uppercase font-semibold mt-0.5 block">
              Portal Operativo
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg text-white/65 hover:text-white hover:bg-white/[0.04] transition-colors shrink-0 cursor-pointer"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
      </div>

      {/* MOBILE SLIDE-OUT MENU OVERLAY */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
          role="button"
          aria-label="Cerrar menú"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR DRAWER PANEL */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111113] flex flex-col h-[100dvh] shrink-0 text-white select-none transform transition-transform duration-300 ease-out lg:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {renderSidebarContent(() => setIsMobileOpen(false))}
      </aside>

      {/* DESKTOP SIDEBAR (DOCKED) */}
      <aside className="hidden lg:flex w-64 bg-[#111113] border-r border-white/[0.06] flex-col h-screen shrink-0 text-white select-none z-10">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
