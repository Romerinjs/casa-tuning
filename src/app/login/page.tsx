"use client";

import { useActionState } from "react";
import { authenticate } from "@/modules/auth/actions";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0A0C] font-sans antialiased">
      {/* Decorative background glows */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[#C9A84C]/5 blur-[120px]" />
      <div className="absolute -bottom-45 -right-45 h-[650px] w-[650px] rounded-full bg-[#9A7A28]/5 blur-[130px]" />

      <div className="w-full max-w-[440px] px-6">
        {/* Logo and title */}
        <div className="mb-8 text-center animate-[fadeIn_0.5s_ease-out_both]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#9A7A28] shadow-[0_8px_30px_rgb(201,168,76,0.2)]">
            <svg
              className="h-8 w-8 text-[#0A0A0C]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Casa Tuning
          </h1>
          <p className="mt-2 text-sm text-[#9898A6]">
            Portal Operativo de Control y Recepción
          </p>
        </div>

        {/* Card with Glassmorphism */}
        <div className="border border-white/[0.06] bg-[#111113]/70 backdrop-blur-xl rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-[fadeIn_0.5s_ease-out_0.1s_both]">
          <form action={formAction} className="space-y-6">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9898A6]">
                Correo Electrónico
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#5A5A65] group-focus-within:text-[#C9A84C] transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@casatuning.com"
                  className="block w-full rounded-xl border border-white/[0.06] bg-[#1A1A1E] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none ring-[#C9A84C]/20 transition-all focus:border-[#C9A84C] focus:ring-4"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#9898A6]">
                Contraseña
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#5A5A65] group-focus-within:text-[#C9A84C] transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="block w-full rounded-xl border border-white/[0.06] bg-[#1A1A1E] py-3 pl-10 pr-4 text-sm text-white placeholder-white/20 outline-none ring-[#C9A84C]/20 transition-all focus:border-[#C9A84C] focus:ring-4"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-medium text-red-400">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#9A7A28] py-3 font-semibold text-[#0A0A0C] shadow-[0_4px_20px_rgb(201,168,76,0.15)] transition-all hover:scale-[1.01] hover:shadow-[0_4px_25px_rgb(201,168,76,0.25)] active:scale-[0.99] disabled:opacity-50"
            >
              {isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-[#5A5A65]">
          &copy; {new Date().getFullYear()} Casa Tuning. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
