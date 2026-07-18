"use client";

import { useState, useActionState, useEffect, useRef, startTransition } from "react";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
  createBrandAction,
  updateBrandAction,
  createUserAction,
  sendTestSoundTemplateAction,
} from "@/app/(authenticated)/administracion/actions";
import { useToast } from "@/components/ui/Toast";
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
  Edit,
  Trash2,
  Sun,
  Shield,
  Palette,
  Lightbulb,
  Bell,
  Radar,
  Radio,
  Smartphone,
  Speaker,
  Sliders,
  Camera as VideoCamera,
  Tv,
  Wind,
  Compass,
  Sparkles,
  Key,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface ServiceItem {
  id: number;
  name: string;
  isActive: boolean;
  icon?: string | null;
  isTopSelling: boolean;
}

interface BrandItem {
  id: number;
  name: string;
  logo?: string | null;
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
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"servicios" | "marcas" | "usuarios" | "whatsapp">("servicios");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);

  const handleLogoUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("El archivo debe ser una imagen.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBrandLogo(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Service Management States
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceName, setServiceName] = useState("");
  const [serviceIcon, setServiceIcon] = useState<string>("Wrench");
  const [serviceIsTopSelling, setServiceIsTopSelling] = useState(false);
  const [serviceIsActive, setServiceIsActive] = useState(true);
  const [serviceState, setServiceState] = useState<{ success: boolean; error?: string } | null>(null);
  const [isServicePending, setIsServicePending] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    type?: "danger" | "primary";
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  // Form states using React 19 useActionState
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [brandName, setBrandName] = useState("");

  const [brandState, brandFormAction, isBrandPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      if (editingBrand) {
        formData.append("id", editingBrand.id.toString());
        return updateBrandAction(prevState, formData);
      } else {
        return createBrandAction(prevState, formData);
      }
    },
    null
  );
  const [userState, userFormAction, isUserPending] = useActionState(createUserAction, null);
  const [whatsappState, whatsappFormAction, isWhatsappPending] = useActionState(sendTestSoundTemplateAction, null);

  // Form references to clear fields on success
  const serviceFormRef = useRef<HTMLFormElement>(null);
  const brandFormRef = useRef<HTMLFormElement>(null);
  const userFormRef = useRef<HTMLFormElement>(null);

  // Static list of supported icons for services
  const SERVICE_ICONS = [
    { name: "Sun", label: "Polarizado", icon: Sun },
    { name: "Shield", label: "PPF", icon: Shield },
    { name: "Palette", label: "Vinilo", icon: Palette },
    { name: "ShieldAlert", label: "Película de seguridad", icon: ShieldAlert },
    { name: "Lightbulb", label: "Luces LED", icon: Lightbulb },
    { name: "Bell", label: "Alarmas", icon: Bell },
    { name: "Radar", label: "Sensores", icon: Radar },
    { name: "Radio", label: "Radios", icon: Radio },
    { name: "Smartphone", label: "CarPlay", icon: Smartphone },
    { name: "Speaker", label: "Sonido/Parlantes", icon: Speaker },
    { name: "Sliders", label: "Plantas de sonido", icon: Sliders },
    { name: "Camera", label: "Cámaras", icon: VideoCamera },
    { name: "Tv", label: "Sistemas Multimedia", icon: Tv },
    { name: "Wind", label: "Plumillas/Aire", icon: Wind },
    { name: "Compass", label: "Brújula/Ruta", icon: Compass },
    { name: "Sparkles", label: "Polichado/Brillo", icon: Sparkles },
    { name: "Key", label: "Duplicados/Llaves", icon: Key },
    { name: "Wrench", label: "General/Herramienta", icon: Wrench },
  ];

  const getIconComponent = (iconName?: string | null) => {
    const found = SERVICE_ICONS.find((i) => i.name === iconName);
    return found ? found.icon : Wrench;
  };

  const startEditService = (service: ServiceItem) => {
    setEditingService(service);
    setServiceName(service.name);
    setServiceIcon(service.icon || "Wrench");
    setServiceIsTopSelling(service.isTopSelling);
    setServiceIsActive(service.isActive);
    setServiceState(null);
  };

  const clearServiceForm = () => {
    setEditingService(null);
    setServiceName("");
    setServiceIcon("Wrench");
    setServiceIsTopSelling(false);
    setServiceIsActive(true);
    setServiceState(null);
    setIsServiceModalOpen(false);
    if (serviceFormRef.current) {
      serviceFormRef.current.reset();
    }
  };

  const startEditBrand = (brand: BrandItem) => {
    setEditingBrand(brand);
    setBrandName(brand.name);
    setBrandLogo(brand.logo || null);
  };

  const clearBrandForm = () => {
    setEditingBrand(null);
    setBrandName("");
    setBrandLogo(null);
    setIsBrandModalOpen(false);
  };

  const triggerDeleteService = (service: ServiceItem) => {
    setConfirmConfig({
      title: "Eliminar Servicio",
      message: `¿Desea eliminar el servicio "${service.name}" permanentemente? Esta acción no se puede deshacer.`,
      type: "danger",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onCancel: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsServicePending(true);
        setServiceState(null);
        try {
          const formData = new FormData();
          formData.append("id", service.id.toString());
          const res = await deleteServiceAction(null, formData);
          setServiceState(res);
          if (res.success) {
            clearServiceForm();
            showToast(`Servicio "${service.name}" eliminado con éxito.`, "success");
          } else if (res.error) {
            showToast(res.error, "error");
          }
        } catch (err) {
          setServiceState({
            success: false,
            error: "Error al intentar eliminar el servicio.",
          });
          showToast("Error al intentar eliminar el servicio.", "error");
        } finally {
          setIsServicePending(false);
        }
      },
    });
  };

  const handleSubmitServiceClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      setServiceState({ success: false, error: "El nombre del servicio es requerido." });
      showToast("El nombre del servicio es requerido.", "warning");
      return;
    }

    setConfirmConfig({
      title: editingService ? "Guardar Cambios" : "Crear Servicio",
      message: editingService
        ? `¿Desea guardar los cambios en el servicio "${editingService.name}"?`
        : `¿Desea crear el servicio "${serviceName.trim()}"?`,
      type: "primary",
      confirmText: editingService ? "Guardar" : "Crear",
      cancelText: "Cancelar",
      onCancel: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        setIsServicePending(true);
        setServiceState(null);
        try {
          const formData = new FormData();
          if (editingService) {
            formData.append("id", editingService.id.toString());
          }
          formData.append("name", serviceName.trim());
          formData.append("icon", serviceIcon);
          formData.append("isTopSelling", serviceIsTopSelling ? "true" : "false");
          formData.append("isActive", serviceIsActive ? "true" : "false");

          let res;
          if (editingService) {
            res = await updateServiceAction(null, formData);
          } else {
            res = await createServiceAction(null, formData);
          }

          setServiceState(res);
          if (res.success) {
            clearServiceForm();
            showToast(
              editingService
                ? `Servicio "${serviceName.trim()}" actualizado con éxito.`
                : `Servicio "${serviceName.trim()}" registrado con éxito.`,
              "success"
            );
          } else if (res.error) {
            showToast(res.error, "error");
          }
        } catch (err) {
          const errorMsg = editingService
            ? "Error al actualizar el servicio."
            : "Error al registrar el servicio.";
          setServiceState({
            success: false,
            error: errorMsg,
          });
          showToast(errorMsg, "error");
        } finally {
          setIsServicePending(false);
        }
      },
    });
  };

  useEffect(() => {
    if (brandState?.success) {
      if (brandFormRef.current) {
        brandFormRef.current.reset();
      }
      setIsBrandModalOpen(false);
      setBrandLogo(null);
      setEditingBrand(null);
      setBrandName("");
    }
  }, [brandState]);

  useEffect(() => {
    if (userState?.success && userFormRef.current) {
      userFormRef.current.reset();
      setIsUserModalOpen(false);
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
      <div className="bg-white border-b border-zinc-200 px-8 shrink-0 flex gap-6 select-none overflow-x-auto max-w-full no-scrollbar">
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
        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "whatsapp"
              ? "border-[#C9A84C] text-[#9A7A28]"
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <Smartphone className="h-4 w-4" />
          Prueba WhatsApp
        </button>
      </div>

      {/* CONTENT PANEL */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === "servicios" ? (
          /* Cuadrícula de 3 columnas para el catálogo de servicios */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-150 pb-5">
              <div>
                <h3 className="text-base font-bold text-zinc-850">Catálogo de Servicios</h3>
                <p className="text-xs text-zinc-400 mt-1">Crea, edita o elimina los servicios y productos destacados del taller.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearServiceForm();
                  setIsServiceModalOpen(true);
                }}
                className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                Crear Nuevo Servicio
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.length === 0 ? (
                <p className="col-span-full p-6 text-center text-sm text-zinc-400 bg-white border border-zinc-200 rounded-xl">
                  No hay servicios registrados.
                </p>
              ) : (
                services.map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-xl p-3.5 bg-white transition-all duration-200 flex items-center justify-between gap-3 group relative ${
                        item.isActive
                          ? "border-zinc-200 hover:border-[#C9A84C]/50 hover:shadow-xs"
                          : "border-zinc-200 bg-zinc-50/50 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center border shrink-0 transition-colors ${
                          item.isActive 
                            ? "bg-[#FBF5E6]/40 border-[#C9A84C]/30 text-[#9A7A28]" 
                            : "bg-zinc-100 border-zinc-200 text-zinc-400"
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${item.isActive ? "text-zinc-800" : "text-zinc-450 line-through"}`}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.isTopSelling && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 bg-[#C9A84C]/20 text-[#9A7A28] border border-[#C9A84C]/30 rounded uppercase tracking-wider">
                                Destacado
                              </span>
                            )}
                            <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                              item.isActive
                                ? "bg-green-50 text-green-700 border-green-200/50"
                                : "bg-red-50 text-red-700 border-red-200/50"
                            }`}>
                              {item.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                        <button
                          type="button"
                          onClick={() => {
                            startEditService(item);
                            setIsServiceModalOpen(true);
                          }}
                          title="Editar"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 bg-zinc-50 border border-zinc-200 hover:text-[#9A7A28] hover:bg-[#FBF5E6]/60 hover:border-[#C9A84C]/30 transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => triggerDeleteService(item)}
                          title="Eliminar"
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50/50 border border-red-100 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === "whatsapp" ? (
          /* Vista de prueba de WhatsApp */
          <div className="max-w-md mx-auto bg-white border border-zinc-200 rounded-2xl shadow-xs p-6 space-y-6 animate-[scaleIn_0.15s_ease-out]">
            <div className="border-b border-zinc-150 pb-4">
              <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                <Smartphone className="h-5.5 w-5.5 text-[#C9A84C]" />
                Prueba de WhatsApp (Kapso)
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Envía un mensaje de prueba utilizando la plantilla Meta <strong>prueba_de_sonido_2</strong> (idioma: <code>es_MX</code>) para verificar que las credenciales y la conexión funcionen correctamente.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const phone = formData.get("phone") as string;
                if (!phone || phone.replace(/\D/g, "").length !== 10) {
                  showToast("El celular debe contener exactamente 10 números.", "warning");
                  return;
                }
                startTransition(() => {
                  whatsappFormAction(formData);
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Número de Celular *
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-550 select-none">
                    +57
                  </span>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="Ej: 3208236441"
                    maxLength={10}
                    className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>
                <p className="text-[9px] text-zinc-450 italic mt-1">
                  El número debe ser de 10 dígitos (Colombia). Se enviará el mensaje con el prefijo +57.
                </p>
              </div>

              {whatsappState?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-center text-xs font-bold text-red-650 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <XCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{whatsappState.error}</span>
                </div>
              )}

              {whatsappState?.success && whatsappState?.message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3.5 text-center text-xs font-bold text-green-650 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 text-green-600" />
                  <span>{whatsappState.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isWhatsappPending}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {isWhatsappPending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  "Enviar Mensaje de Prueba"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Vista tradicional en columnas divididas para Marcas y Usuarios */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* LEFT 2 COLUMNS: LISTS */}
            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
              {/* MARCAS LIST */}
              {activeTab === "marcas" && (
                <div>
                  <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-800">Marcas de vehículos</h3>
                      <p className="text-[10px] text-zinc-400">Listado de marcas disponibles en el sistema.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBrandModalOpen(true)}
                      className="hidden sm:inline-flex lg:hidden items-center justify-center gap-1 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-3.5 py-2 text-[11px] font-bold text-[#0A0A0C] transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Crear Nueva Marca
                    </button>
                  </div>
                  <div className="p-5">
                    {brands.length === 0 ? (
                      <p className="text-center text-sm text-zinc-400 py-6">No hay marcas registradas.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {brands.map((item) => (
                          <div
                            key={item.id}
                            className="group bg-white border border-zinc-200 hover:border-[#C9A84C]/50 hover:shadow-xs rounded-xl p-4 transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center relative"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                startEditBrand(item);
                                setIsBrandModalOpen(true);
                              }}
                              className="absolute top-2 right-2 h-7 w-7 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-[#9A7A28] hover:border-[#C9A84C]/35 hover:bg-[#FBF5E6]/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                              title="Editar Marca"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            {item.logo ? (
                              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-zinc-50 border border-zinc-150 p-2 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105 shrink-0">
                                <img src={item.logo} alt={item.name} className="h-full w-full object-contain" />
                              </div>
                            ) : (
                              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-gradient-to-br from-[#FBF5E6] to-[#E9D5B0] text-[#9A7A28] border border-[#C9A84C]/25 flex items-center justify-center text-2xl font-extrabold transition-transform duration-200 group-hover:scale-105 shrink-0 select-none shadow-xs">
                                {item.name.substring(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs font-bold text-zinc-800 group-hover:text-[#9A7A28] transition-colors line-clamp-1">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* USUARIOS LIST */}
              {activeTab === "usuarios" && (
                <div>
                  <div className="p-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-800">Usuarios del sistema</h3>
                      <p className="text-[10px] text-zinc-400">Listado de usuarios registrados en el sistema.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(true)}
                      className="hidden sm:inline-flex lg:hidden items-center justify-center gap-1 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-3.5 py-2 text-[11px] font-bold text-[#0A0A0C] transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Crear Nuevo Usuario
                    </button>
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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-650">
                          {item.role.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT 1 COLUMN: FORMS */}
            <div className="hidden lg:flex bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex-col">
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
                    {editingBrand ? (
                      <>
                        <Edit className="h-4.5 w-4.5 text-[#C9A84C]" />
                        Editar Marca
                      </>
                    ) : (
                      <>
                        <Plus className="h-4.5 w-4.5 text-[#C9A84C]" />
                        Crear Nueva Marca
                      </>
                    )}
                  </h3>

                  <input type="hidden" name="id" value={editingBrand?.id || ""} />

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Nombre de la Marca *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ej. Suzuki"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Logo de la Marca (Opcional)
                    </label>
                    <input type="hidden" name="logo" value={brandLogo || ""} />
                    {brandLogo ? (
                      <div className="relative border border-zinc-200 rounded-xl p-3 bg-zinc-50 flex items-center justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-lg border border-zinc-250 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={brandLogo} alt="Preview" className="h-full w-full object-contain" />
                          </div>
                          <span className="text-xs text-zinc-500 font-semibold truncate max-w-[150px]">Logo cargado</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setBrandLogo(null)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-655 transition-all cursor-pointer"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleLogoUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (ev) => {
                            const file = (ev.target as HTMLInputElement).files?.[0];
                            if (file) handleLogoUpload(file);
                          };
                          input.click();
                        }}
                        className="border-2 border-dashed border-zinc-200 hover:border-[#C9A84C]/50 hover:bg-[#FBF5E6]/10 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group select-none animate-[fadeIn_0.15s_ease-out]"
                      >
                        <div className="h-8 w-8 rounded-lg bg-zinc-50 group-hover:bg-[#FBF5E6]/40 flex items-center justify-center border border-zinc-150 group-hover:border-[#C9A84C]/25 text-zinc-400 group-hover:text-[#9A7A28] transition-colors">
                          <Plus className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-zinc-750">Subir Logo</p>
                          <p className="text-[9px] text-zinc-400">Arrastra o haz clic</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {brandState?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{brandState.error}</span>
                    </div>
                  )}

                  {brandState?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      <span>Marca guardada con éxito</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      type="submit"
                      disabled={isBrandPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isBrandPending ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                      ) : (
                        editingBrand ? "Guardar Cambios" : "Guardar Marca"
                      )}
                    </button>

                    {editingBrand && (
                      <button
                        type="button"
                        onClick={clearBrandForm}
                        className="w-full inline-flex items-center justify-center h-10 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>
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
            </div>
          </div>
        )}
      </div>

      {/* USER DETAILS MODAL (LIFTED OUT) */}
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
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/50 transition-all cursor-pointer"
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
                  className="px-4 py-2 bg-[#C9A84C] hover:bg-[#9A7A28] text-[#0A0A0C] rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FORMULARIO DE SERVICIO EN MODAL EMERGENTE */}
      {isServiceModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => {
              setIsServiceModalOpen(false);
              clearServiceForm();
            }}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-40 w-full max-w-lg border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
              <h3 className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                {editingService ? (
                  <>
                    <Edit className="h-4.5 w-4.5 text-[#C9A84C]" />
                    Editar Servicio
                  </>
                ) : (
                  <>
                    <Plus className="h-4.5 w-4.5 text-[#C9A84C]" />
                    Crear Nuevo Servicio
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsServiceModalOpen(false);
                  clearServiceForm();
                }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/50 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form
              ref={serviceFormRef}
              onSubmit={handleSubmitServiceClick}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Ej. PPF Mate"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Grid interactivo selector de icono */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Seleccionar Icono
                </label>
                <div className="grid grid-cols-6 gap-2 border border-zinc-150 rounded-lg p-2.5 bg-zinc-50/50 max-h-[145px] overflow-y-auto">
                  {SERVICE_ICONS.map((i) => {
                    const IconItem = i.icon;
                    const isSelected = serviceIcon === i.name;
                    return (
                      <button
                        key={i.name}
                        type="button"
                        onClick={() => setServiceIcon(i.name)}
                        title={i.label}
                        className={`h-9 w-9 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FBF5E6]/80 border-[#C9A84C] text-[#9A7A28] shadow-[0_0_0_2px_rgba(201,168,76,0.15)] scale-105"
                            : "bg-white border-zinc-200 text-zinc-450 hover:text-zinc-800 hover:border-zinc-350 hover:bg-zinc-50"
                        }`}
                      >
                        <IconItem className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Toggle Producto Más Vendido */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    ¿Más vendido?
                  </label>
                  <button
                    type="button"
                    onClick={() => setServiceIsTopSelling(!serviceIsTopSelling)}
                    className={`w-full py-2 px-3 border rounded-lg flex items-center justify-center gap-1.5 font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                      serviceIsTopSelling
                        ? "border-[#C9A84C]/50 bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
                    }`}
                  >
                    {serviceIsTopSelling ? "Sí" : "No"}
                  </button>
                </div>

                {/* Toggle Estado (Activo/Inactivo) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Estado
                  </label>
                  <button
                    type="button"
                    onClick={() => setServiceIsActive(!serviceIsActive)}
                    className={`w-full py-2 px-3 border rounded-lg flex items-center justify-center gap-1.5 font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                      serviceIsActive
                        ? "border-green-200 bg-green-50 text-green-700 shadow-xs"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {serviceIsActive ? "Activo" : "Inactivo"}
                  </button>
                </div>
              </div>

              {serviceState?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{serviceState.error}</span>
                </div>
              )}

              {serviceState?.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>Servicio guardado con éxito</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isServicePending}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isServicePending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                ) : (
                  editingService ? "Guardar Cambios" : "Guardar Servicio"
                )}
              </button>
            </form>
          </div>
        </>
      )}
           {isBrandModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out] lg:hidden"
            onClick={clearBrandForm}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-40 w-full max-w-sm border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both] flex flex-col lg:hidden">
            <div className="p-5 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
              <h3 className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                {editingBrand ? (
                  <>
                    <Edit className="h-4.5 w-4.5 text-[#C9A84C]" />
                    Editar Marca
                  </>
                ) : (
                  <>
                    <Tag className="h-4.5 w-4.5 text-[#C9A84C]" />
                    Crear Nueva Marca
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={clearBrandForm}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-655 hover:bg-zinc-200/50 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                startTransition(() => {
                  brandFormAction(formData);
                });
              }}
              className="p-6 space-y-4"
            >
              <input type="hidden" name="id" value={editingBrand?.id || ""} />

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ej. Suzuki"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Logo de la Marca (Opcional)
                </label>
                <input type="hidden" name="logo" value={brandLogo || ""} />
                {brandLogo ? (
                  <div className="relative border border-zinc-200 rounded-xl p-3 bg-zinc-50 flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 rounded-lg border border-zinc-250 bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img src={brandLogo} alt="Preview" className="h-full w-full object-contain" />
                      </div>
                      <span className="text-xs text-zinc-500 font-semibold truncate max-w-[150px]">Logo cargado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrandLogo(null)}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-650 transition-all cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleLogoUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (ev) => {
                        const file = (ev.target as HTMLInputElement).files?.[0];
                        if (file) handleLogoUpload(file);
                      };
                      input.click();
                    }}
                    className="border-2 border-dashed border-zinc-200 hover:border-[#C9A84C]/50 hover:bg-[#FBF5E6]/10 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 group select-none animate-[fadeIn_0.15s_ease-out]"
                  >
                    <div className="h-8 w-8 rounded-lg bg-zinc-50 group-hover:bg-[#FBF5E6]/40 flex items-center justify-center border border-zinc-150 group-hover:border-[#C9A84C]/25 text-zinc-400 group-hover:text-[#9A7A28] transition-colors">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-zinc-755">Subir Logo</p>
                      <p className="text-[9px] text-zinc-400">Arrastra o haz clic</p>
                    </div>
                  </div>
                )}
              </div>

              {brandState?.error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{brandState.error}</span>
                </div>
              )}

              {brandState?.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>Marca guardada con éxito</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isBrandPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBrandPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                  ) : (
                    editingBrand ? "Guardar Cambios" : "Guardar Marca"
                  )}
                </button>

                {editingBrand && (
                  <button
                    type="button"
                    onClick={clearBrandForm}
                    className="w-full inline-flex items-center justify-center h-10 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}

      {/* USER MODAL FOR MOBILE */}
      {isUserModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs z-40 transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out] lg:hidden"
            onClick={() => setIsUserModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-40 w-full max-w-sm border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both] flex flex-col lg:hidden">
            <div className="p-5 border-b border-zinc-150 flex items-center justify-between bg-zinc-50">
              <h3 className="font-bold text-zinc-950 text-sm flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-[#C9A84C]" />
                Crear Nuevo Usuario
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/50 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                startTransition(() => {
                  userFormAction(formData);
                });
              }}
              className="p-6 space-y-4"
            >
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
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all cursor-pointer font-semibold"
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
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{userState.error}</span>
                </div>
              )}

              {userState?.success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-xs font-semibold text-green-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>Usuario creado con éxito</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUserPending}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUserPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                ) : (
                  "Guardar Usuario"
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Dynamic Floating Action Button (FAB) for Mobile catalog views */}
      <div className="fixed bottom-6 right-6 z-30 group lg:hidden">
        {/* Tooltip */}
        <div className={`absolute right-0 bottom-16 bg-[#0A0A0C] text-[#F5F5F7] text-[10px] font-bold py-2 px-3 rounded-xl shadow-xl border border-zinc-800/60 whitespace-nowrap transition-all duration-300 pointer-events-none select-none after:content-[''] after:absolute after:top-full after:right-5 after:border-4 after:border-transparent after:border-t-[#0A0A0C] ${
          showTooltip
            ? "opacity-100 scale-100 animate-tooltip-bounce"
            : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
        }`}>
          {activeTab === "servicios" ? "Crear servicio" : activeTab === "marcas" ? "Crear marca" : "Crear usuario"}
        </div>
        {/* Floating Action Button */}
        <button
          type="button"
          onClick={() => {
            if (activeTab === "servicios") {
              clearServiceForm();
              setIsServiceModalOpen(true);
            } else if (activeTab === "marcas") {
              clearBrandForm();
              setIsBrandModalOpen(true);
            } else {
              setIsUserModalOpen(true);
            }
          }}
          className="h-12 w-12 rounded-xl bg-[#C9A84C] hover:bg-[#9A7A28] text-[#0A0A0C] flex items-center justify-center shadow-lg border border-[#9A7A28]/20 transition-all active:scale-95 select-none cursor-pointer"
        >
          <Plus className="h-6 w-6 stroke-[3]" />
        </button>
      </div>
      {confirmConfig && (
        <>
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 transition-opacity duration-300 animate-[fadeIn_0.2s_ease-out]" />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-sm border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both] p-5">
            <h3 className="font-bold text-zinc-950 text-sm mb-2">{confirmConfig.title}</h3>
            <p className="text-xs text-zinc-550 mb-4">{confirmConfig.message}</p>
            <div className="flex justify-end gap-2 text-xs font-bold font-sans">
              <button
                type="button"
                onClick={confirmConfig.onCancel}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg text-zinc-500 transition-colors cursor-pointer select-none"
              >
                {confirmConfig.cancelText || "Cancelar"}
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className={`px-4 py-2 rounded-lg text-white transition-colors cursor-pointer select-none ${
                  confirmConfig.type === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#C9A84C] hover:bg-[#9A7A28] text-[#0A0A0C]"
                }`}
              >
                {confirmConfig.confirmText || "Aceptar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
