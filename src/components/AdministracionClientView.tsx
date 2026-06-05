"use client";

import { useState, useActionState, useEffect, useRef, startTransition } from "react";
import {
  createServiceAction,
  createBrandAction,
  createUserAction,
} from "@/app/(authenticated)/administracion/actions";
import {
  ShieldAlert,
  Tag,
  Wrench,
  UserPlus,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

interface ServiceItem {
  id: number;
  name: string;
  isActive: boolean;
}

interface BrandItem {
  id: number;
  name: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  role: {
    name: string;
  };
}

interface RoleItem {
  id: number;
  name: string;
}

interface AdministracionClientViewProps {
  services: ServiceItem[];
  brands: BrandItem[];
  users: UserItem[];
  roles: RoleItem[];
}

export default function AdministracionClientView({
  services,
  brands,
  users,
  roles,
}: AdministracionClientViewProps) {
  const [activeTab, setActiveTab] = useState<"servicios" | "marcas" | "usuarios">("servicios");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form states using React 19 useActionState
  const [serviceState, serviceFormAction, isServicePending] = useActionState(createServiceAction, null);
  const [brandState, brandFormAction, isBrandPending] = useActionState(createBrandAction, null);
  const [userState, userFormAction, isUserPending] = useActionState(createUserAction, null);

  // Form references to clear fields on success
  const serviceFormRef = useRef<HTMLFormElement>(null);
  const brandFormRef = useRef<HTMLFormElement>(null);
  const userFormRef = useRef<HTMLFormElement>(null);

  // Clear fields upon successful additions
  useEffect(() => {
    if (serviceState?.success && serviceFormRef.current) {
      serviceFormRef.current.reset();
    }
  }, [serviceState]);

  useEffect(() => {
    if (brandState?.success && brandFormRef.current) {
      brandFormRef.current.reset();
    }
  }, [brandState]);

  useEffect(() => {
    if (userState?.success && userFormRef.current) {
      userFormRef.current.reset();
    }
  }, [userState]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <ShieldAlert className="h-5.5 w-5.5 text-[#C9A84C]" />
          Administración del Sistema
        </h2>
      </header>

      {/* TABS ROW */}
      <div className="bg-white border-b border-zinc-200 px-8 shrink-0 flex gap-6 select-none">
        <button
          onClick={() => setActiveTab("servicios")}
          className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "servicios"
              ? "border-[#C9A84C] text-[#9A7A28]"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Servicios
        </button>
        <button
          onClick={() => setActiveTab("marcas")}
          className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "marcas"
              ? "border-[#C9A84C] text-[#9A7A28]"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Tag className="h-4 w-4" />
          Marcas de auto
        </button>
        <button
          onClick={() => setActiveTab("usuarios")}
          className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "usuarios"
              ? "border-[#C9A84C] text-[#9A7A28]"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Users className="h-4 w-4" />
          Usuarios
        </button>
      </div>

      {/* CONTENT PANEL */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT 2 COLUMNS: LISTS */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
            {/* SERVICIOS LIST */}
            {activeTab === "servicios" && (
              <div>
                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-800">Catálogo de Servicios</h3>
                </div>
                <div className="divide-y divide-zinc-200">
                  {services.length === 0 ? (
                    <p className="p-5 text-center text-sm text-zinc-400">No hay servicios registrados.</p>
                  ) : (
                    services.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-zinc-800">{item.name}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">ID: #{item.id}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          item.isActive
                            ? "bg-green-50 text-green-700 border-green-200/50"
                            : "bg-red-50 text-red-700 border-red-200/50"
                        }`}>
                          {item.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MARCAS LIST */}
            {activeTab === "marcas" && (
              <div>
                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-800">Marcas de vehículos</h3>
                </div>
                <div className="divide-y divide-zinc-200">
                  {brands.length === 0 ? (
                    <p className="p-5 text-center text-sm text-zinc-400">No hay marcas registradas.</p>
                  ) : (
                    brands.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-zinc-800">{item.name}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">ID: #{item.id}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* USUARIOS LIST */}
            {activeTab === "usuarios" && (
              <div>
                <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                  <h3 className="text-sm font-bold text-zinc-800">Usuarios del sistema</h3>
                </div>
                <div className="divide-y divide-zinc-200">
                  {users.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedUser(item)}
                      className="p-4 flex items-center justify-between hover:bg-zinc-50/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-zinc-100 flex items-center justify-center text-[#9A7A28] font-bold text-xs shrink-0">
                          {item.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-805 leading-tight">{item.name}</p>
                          <span className="text-xs text-zinc-400 mt-0.5 block">{item.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-605">
                        {item.role.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT 1 COLUMN: FORMS */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
            {/* SERVICIOS FORM */}
            {activeTab === "servicios" && (
              <form
                ref={serviceFormRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  startTransition(() => {
                    serviceFormAction(formData);
                  });
                }}
                className="p-6 space-y-4"
              >
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Plus className="h-4.5 w-4.5 text-[#C9A84C]" />
                  Crear Nuevo Servicio
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ej. PPF Mate"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {serviceState?.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>{serviceState.error}</span>
                  </div>
                )}

                {serviceState?.success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Servicio creado con éxito</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isServicePending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50"
                >
                  {isServicePending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                  ) : (
                    "Guardar Servicio"
                  )}
                </button>
              </form>
            )}

            {/* MARCAS FORM */}
            {activeTab === "marcas" && (
              <form
                ref={brandFormRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  startTransition(() => {
                    brandFormAction(formData);
                  });
                }}
                className="p-6 space-y-4"
              >
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Plus className="h-4.5 w-4.5 text-[#C9A84C]" />
                  Crear Nueva Marca
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre de la Marca *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ej. Suzuki"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {brandState?.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>{brandState.error}</span>
                  </div>
                )}

                {brandState?.success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Marca creada con éxito</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBrandPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50"
                >
                  {isBrandPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                  ) : (
                    "Guardar Marca"
                  )}
                </button>
              </form>
            )}

            {/* USUARIOS FORM */}
            {activeTab === "usuarios" && (
              <form
                ref={userFormRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  startTransition(() => {
                    userFormAction(formData);
                  });
                }}
                className="p-6 space-y-4"
              >
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <UserPlus className="h-4.5 w-4.5 text-[#C9A84C]" />
                  Crear Nuevo Usuario
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Ej. Alejandro Pérez"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="ejemplo@casatuning.com"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Rol *
                  </label>
                  <select
                    name="roleId"
                    required
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Seleccionar...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {userState?.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>{userState.error}</span>
                  </div>
                )}

                {userState?.success && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Usuario creado con éxito</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUserPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50"
                >
                  {isUserPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                  ) : (
                    "Guardar Usuario"
                  )}
                </button>
              </form>
            )}
            {/* USER DETAILS MODAL */}
            {selectedUser && (
              <>
                <div
                  className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-300"
                  onClick={() => setSelectedUser(null)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both]">
                  {/* Modal Header */}
                  <div className="p-5 border-b border-zinc-205 flex items-center justify-between bg-zinc-50">
                    <h3 className="font-bold text-zinc-950 text-sm">Detalles de Usuario</h3>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/50 transition-all"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-[#9A7A28] font-bold text-sm shrink-0 border border-zinc-200">
                        {selectedUser.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 leading-tight">{selectedUser.name}</h4>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">Usuario ID: #{selectedUser.id}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                      <div className="flex justify-between text-xs gap-3">
                        <span className="text-zinc-400 font-medium">Correo:</span>
                        <span className="text-zinc-800 font-semibold break-all text-right">{selectedUser.email}</span>
                      </div>
                      <div className="flex justify-between text-xs gap-3">
                        <span className="text-zinc-400 font-medium">Rol del sistema:</span>
                        <span className="font-bold text-[#9A7A28] text-right">{selectedUser.role.name}</span>
                      </div>
                      <div className="flex justify-between text-xs gap-3">
                        <span className="text-zinc-400 font-medium">Estado:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          selectedUser.isActive
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {selectedUser.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs gap-3">
                        <span className="text-zinc-400 font-medium">Registrado el:</span>
                        <span className="text-zinc-600 text-right">
                          {new Date(selectedUser.createdAt).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="px-4 py-2 bg-[#C9A84C] hover:bg-[#9A7A28] text-[#0A0A0C] rounded-lg text-xs font-bold transition-all"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
