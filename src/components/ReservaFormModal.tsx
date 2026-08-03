"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  X,
  Search,
  CalendarClock,
  User,
  Car,
  Wrench,
  Check,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Sun,
  Shield,
  Palette,
  ShieldAlert,
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
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { createReservationAction, updateReservationAction } from "@/app/(authenticated)/reservas/actions";
import { useToast } from "@/components/ui/Toast";

interface ClientOption {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  cars: {
    id: number;
    plate: string;
    model: string;
    brand: { id: number; name: string; logo?: string | null };
  }[];
}

interface BrandOption {
  id: number;
  name: string;
  logo?: string | null;
}

interface ServiceOption {
  id: number;
  name: string;
  isActive: boolean;
  icon?: string | null;
  isTopSelling: boolean;
}

interface ReservaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOption[];
  brands: BrandOption[];
  services: ServiceOption[];
  initialData?: any | null;
}

/** Obtiene la fecha actual en Colombia en formato YYYY-MM-DD */
const getTodayColombiaStr = () => {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
};

/** Genera las franjas de horario laboral de Casa Tuning para un día dado */
function getBusinessTimeSlots(dateStr: string): { value: string; label: string }[] {
  if (!dateStr) return [];

  // Parse date in Colombia timezone
  const dateObj = new Date(`${dateStr}T12:00:00-05:00`);
  const dayOfWeek = dateObj.getDay(); // 0 = Dom, 1 = Lun, ... 6 = Sáb

  if (dayOfWeek === 0) {
    return []; // Domingo cerrado
  }

  const slots: { value: string; label: string }[] = [];
  const startHour = dayOfWeek === 6 ? 8 : 8;
  const startMinute = dayOfWeek === 6 ? 0 : 30;
  const endHour = 18;
  const endMinute = 30;

  let currentMinutes = startHour * 60 + startMinute;
  const totalEndMinutes = endHour * 60 + endMinute;

  while (currentMinutes <= totalEndMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const hStr = String(h).padStart(2, "0");
    const mStr = String(m).padStart(2, "0");
    const timeVal = `${hStr}:${mStr}`;

    const period = h >= 12 ? "p. m." : "a. m.";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayLabel = `${displayH}:${mStr} ${period}`;

    slots.push({ value: timeVal, label: displayLabel });
    currentMinutes += 30;
  }

  return slots;
}

export default function ReservaFormModal({
  isOpen,
  onClose,
  clients,
  brands,
  services,
  initialData,
}: ReservaFormModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Wizard workflow state
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [clientMode, setClientMode] = useState<"registered" | "new">("registered");
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);

  // Dropdown / Click outside refs
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  // Search & Client state
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Vehicle state
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState<number | "">("");

  // Date & Time state
  const todayColombia = getTodayColombiaStr();
  const [scheduledDate, setScheduledDate] = useState(todayColombia);
  const [scheduledTime, setScheduledTime] = useState("09:00");

  // Services
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Notes & ErrorMsg
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Click outside listener to close custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setIsClientSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      setClientMode("new"); // En edición no mostramos buscador de clientes
      setSelectedClientId(initialData.clientId || null);
      setClientName(initialData.client?.name || "");
      setClientPhone(initialData.client?.phone || "");
      setClientEmail(initialData.client?.email || "");

      setSelectedCarId(initialData.carId || null);
      setVehiclePlate(initialData.vehiclePlate || initialData.car?.plate || "");
      setVehicleModel(initialData.vehicleModel || initialData.car?.model || "");
      setSelectedBrandId(initialData.brandId || initialData.car?.brandId || "");

      if (initialData.scheduledAt) {
        const d = new Date(initialData.scheduledAt);
        const dateStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Bogota",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
        const timeStr = new Intl.DateTimeFormat("en-GB", {
          timeZone: "America/Bogota",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(d);

        setScheduledDate(dateStr);
        setScheduledTime(timeStr);
      }

      if (initialData.services && Array.isArray(initialData.services)) {
        setSelectedServiceIds(initialData.services.map((s: any) => s.serviceId));
      }
      setNotes(initialData.notes || "");
      setActiveStep(1);
    } else {
      const nextDate = getTodayColombiaStr();
      setScheduledDate(nextDate);
      setScheduledTime("09:00");
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setSelectedClientId(null);
    setClientSearchTerm("");
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setSelectedCarId(null);
    setVehiclePlate("");
    setVehicleModel("");
    setSelectedBrandId("");
    setSelectedServiceIds([]);
    setNotes("");
    setErrorMsg("");
    setActiveStep(1);
    setClientMode("registered");
    setIsClientSearchOpen(false);
    setIsBrandDropdownOpen(false);
  };

  if (!isOpen) return null;

  const timeSlots = getBusinessTimeSlots(scheduledDate);
  const isSundaySelected = new Date(`${scheduledDate}T12:00:00-05:00`).getDay() === 0;

  const filteredClients = clientSearchTerm.trim().length >= 2
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
          c.phone.includes(clientSearchTerm)
      )
    : [];

  const handleSelectClient = (c: ClientOption) => {
    setSelectedClientId(c.id);
    setClientName(c.name);
    setClientPhone(c.phone);
    setClientEmail(c.email || "");
    setClientSearchTerm("");
    setIsClientSearchOpen(false);

    if (c.cars && c.cars.length > 0) {
      const firstCar = c.cars[0];
      setSelectedCarId(firstCar.id);
      setVehiclePlate(firstCar.plate);
      setVehicleModel(firstCar.model);
      setSelectedBrandId(firstCar.brand.id);
    } else {
      setSelectedCarId(null);
      setVehiclePlate("");
      setVehicleModel("");
      setSelectedBrandId("");
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const toggleService = (id: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
    setErrorMsg("");
  };

  // Map service names to Lucide icons dynamically
  const getServiceIcon = (name: string, iconName?: string | null) => {
    if (iconName) {
      switch (iconName) {
        case "Sun": return Sun;
        case "Shield": return Shield;
        case "Palette": return Palette;
        case "ShieldAlert": return ShieldAlert;
        case "Lightbulb": return Lightbulb;
        case "Bell": return Bell;
        case "Radar": return Radar;
        case "Radio": return Radio;
        case "Smartphone": return Smartphone;
        case "Speaker": return Speaker;
        case "Sliders": return Sliders;
        case "Camera": return VideoCamera;
        case "Tv": return Tv;
        case "Wind": return Wind;
        case "Compass": return Compass;
        case "HelpCircle": return HelpCircle;
        default: break;
      }
    }

    const serviceName = name.toLowerCase();
    if (serviceName.includes("polarizado")) return Sun;
    if (serviceName.includes("ppf")) return Shield;
    if (serviceName.includes("vinilo")) return Palette;
    if (serviceName.includes("película de seguridad") || serviceName.includes("pelicula de seguridad")) return ShieldAlert;
    if (serviceName.includes("led")) return Lightbulb;
    if (serviceName.includes("exploradora")) return Lightbulb;
    if (serviceName.includes("alarma")) return Bell;
    if (serviceName.includes("sensor")) return Radar;
    if (serviceName.includes("radio")) return Radio;
    if (serviceName.includes("carplay")) return Smartphone;
    if (serviceName.includes("parlante")) return Speaker;
    if (serviceName.includes("planta")) return Sliders;
    if (serviceName.includes("cámara") || serviceName.includes("camara")) return VideoCamera;
    if (serviceName.includes("pantalla") || serviceName.includes("multimedia")) return Tv;
    if (serviceName.includes("plumilla")) return Wind;
    return HelpCircle;
  };

  const handlePhoneChange = (val: string) => {
    setClientPhone(val.replace(/\D/g, "").slice(0, 10));
    setErrorMsg("");
  };

  const handlePlateChange = (val: string) => {
    setVehiclePlate(val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6));
    setErrorMsg("");
  };

  // STEP VALIDATIONS
  const validateStep1 = () => {
    setErrorMsg("");
    if (!clientName.trim()) {
      setErrorMsg("El nombre completo del cliente es obligatorio.");
      return false;
    }
    if (clientPhone.length !== 10) {
      setErrorMsg("El celular del cliente debe contener exactamente 10 dígitos.");
      return false;
    }
    if (vehiclePlate && vehiclePlate.length < 5) {
      setErrorMsg("La placa del vehículo debe contener al menos 5 caracteres alfanuméricos.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setErrorMsg("");
    if (!scheduledDate || !scheduledTime) {
      setErrorMsg("Debes seleccionar una fecha y hora válida.");
      return false;
    }
    if (scheduledDate < todayColombia) {
      setErrorMsg("No se pueden agendar citas en fechas anteriores a hoy.");
      return false;
    }
    if (isSundaySelected) {
      setErrorMsg("Casa Tuning no atiende los domingos. Elige un día entre Lunes y Sábado.");
      return false;
    }
    if (selectedServiceIds.length === 0) {
      setErrorMsg("Debes seleccionar al menos un servicio para agendar.");
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setActiveStep(2);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg("");
    setActiveStep(1);
  };

  const handleHeaderClick = (step: 1 | 2) => {
    if (step === 1) {
      setActiveStep(1);
    } else if (step === 2 && validateStep1()) {
      setActiveStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, "");
    // Submit with Colombia timezone to avoid shifting bugs
    const fullIsoString = `${scheduledDate}T${scheduledTime}:00-05:00`;

    const formData = new FormData();
    formData.append("clientName", clientName);
    formData.append("clientPhone", cleanPhone);
    if (clientEmail) formData.append("clientEmail", clientEmail);
    formData.append("scheduledAt", fullIsoString);
    if (selectedCarId) formData.append("carId", selectedCarId.toString());
    if (vehiclePlate) formData.append("vehiclePlate", vehiclePlate);
    if (vehicleModel) formData.append("vehicleModel", vehicleModel);
    if (selectedBrandId) formData.append("brandId", selectedBrandId.toString());
    if (notes) formData.append("notes", notes);

    selectedServiceIds.forEach((id) => {
      formData.append("services", id.toString());
    });

    startTransition(async () => {
      try {
        let res;
        if (initialData) {
          res = await updateReservationAction(initialData.id, formData);
        } else {
          res = await createReservationAction(null, formData);
        }

        if (res.success) {
          showToast(
            initialData ? "Reserva actualizada con éxito." : "Reserva agendada y confirmación enviada por WhatsApp.",
            "success"
          );
          onClose();
        } else {
          setErrorMsg(res.error || "Ocurrió un error al guardar la reserva.");
        }
      } catch (err: any) {
        setErrorMsg("Error de conexión al guardar la reserva.");
      }
    });
  };

  // Build step validations status for header checkmark
  const isStep1Valid = clientName.trim().length > 0 && clientPhone.length === 10;
  const isStep2Valid = selectedServiceIds.length > 0 && !isSundaySelected;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 md:p-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white border border-zinc-200/90 w-full h-full max-h-screen sm:h-auto sm:max-h-[92vh] sm:max-w-2xl flex flex-col sm:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#111113] text-white flex items-center justify-between border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#9A7A28] flex items-center justify-center text-[#0A0A0C] shrink-0">
              <CalendarClock className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {initialData ? `Editar Reserva ${initialData.code}` : "Agendar Nueva Reserva"}
              </h3>
              <p className="text-xs text-white/50">
                Casa Tuning Premium Services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F7F7F8] space-y-4">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-xs animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ==================== PASO 1: DATOS DEL CLIENTE Y VEHÍCULO ==================== */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
            {/* Header Accordion */}
            <div
              onClick={() => handleHeaderClick(1)}
              className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${
                activeStep === 1 ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl" : "hover:bg-zinc-50/40 rounded-xl"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isStep1Valid
                      ? "bg-green-100 text-green-700"
                      : activeStep === 1
                      ? "bg-[#C9A84C]/25 text-[#9A7A28]"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {isStep1Valid ? "✓" : "1"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                    Datos del Cliente y Vehículo
                  </h3>
                  {activeStep !== 1 && clientName && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                      {clientName} · {clientPhone} {vehiclePlate && `· ${vehiclePlate}`}
                    </p>
                  )}
                </div>
              </div>
              {activeStep === 1 ? (
                <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />
              )}
            </div>

            {/* Content Accordion */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                activeStep === 1 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className={activeStep === 1 ? "overflow-visible" : "overflow-hidden"}>
                <div className="p-5 space-y-4 border-t border-zinc-100 bg-white">
                  
                  {/* Search toggle - Only when not editing */}
                  {!initialData && (
                    <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setClientMode("registered");
                          setErrorMsg("");
                        }}
                        className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                          clientMode === "registered"
                            ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Buscar Registrado
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setClientMode("new");
                          setSelectedClientId(null);
                          setClientName("");
                          setClientPhone("");
                          setClientEmail("");
                          setSelectedCarId(null);
                          setVehiclePlate("");
                          setVehicleModel("");
                          setSelectedBrandId("");
                          setErrorMsg("");
                        }}
                        className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                          clientMode === "new"
                            ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Nuevo Cliente
                      </button>
                    </div>
                  )}

                  {/* Registered client search */}
                  {clientMode === "registered" && !initialData && (
                    <div className="space-y-1 relative" ref={clientSearchRef}>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Buscar Cliente (Celular o Nombre)
                      </label>
                      <div className="relative">
                        <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Escriba celular o nombre..."
                          value={clientSearchTerm}
                          onChange={(e) => {
                            setClientSearchTerm(e.target.value);
                            setIsClientSearchOpen(true);
                          }}
                          onFocus={() => setIsClientSearchOpen(true)}
                          className="w-full h-11 pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                      
                      {isClientSearchOpen && filteredClients.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-zinc-100">
                          {filteredClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectClient(c)}
                              className="w-full text-left px-4 py-2.5 hover:bg-[#FBF5E6]/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-zinc-950 truncate">{c.name}</p>
                                <p className="text-[11px] text-zinc-500">{c.phone}</p>
                              </div>
                              <span className="text-[10px] font-bold text-[#9A7A28] bg-[#FBF5E6] px-2 py-0.5 rounded-md shrink-0">
                                Seleccionar
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client form inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => {
                            setClientName(e.target.value);
                            setErrorMsg("");
                          }}
                          placeholder="Ej. Juan Pérez"
                          className="w-full h-11 pl-10 pr-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                        Celular WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        value={clientPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="Ej. 3001234567"
                        className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                        Correo Electrónico (Opcional)
                      </label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => {
                          setClientEmail(e.target.value);
                          setErrorMsg("");
                        }}
                        placeholder="cliente@ejemplo.com"
                        className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Registered client cars buttons */}
                  {clientMode === "registered" && selectedClient && selectedClient.cars && selectedClient.cars.length > 0 && (
                    <div className="bg-[#FBF5E6]/40 p-3.5 rounded-xl border border-[#C9A84C]/20 space-y-2">
                      <span className="text-[10px] font-bold text-[#9A7A28] uppercase tracking-wider block">
                        Vehículos Registrados del Cliente
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedClient.cars.map((car) => (
                          <button
                            key={car.id}
                            type="button"
                            onClick={() => {
                              setSelectedCarId(car.id);
                              setVehiclePlate(car.plate);
                              setVehicleModel(car.model);
                              setSelectedBrandId(car.brand.id);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                              selectedCarId === car.id
                                ? "bg-[#9A7A28] text-white border-[#9A7A28]"
                                : "bg-white text-zinc-700 border-zinc-200 hover:border-[#C9A84C] hover:bg-[#FBF5E6]/10"
                            }`}
                          >
                            {car.brand.logo && (
                              <img
                                src={car.brand.logo}
                                alt={car.brand.name}
                                className="h-4.5 w-4.5 object-contain rounded shrink-0 bg-white"
                              />
                            )}
                            <span>{car.brand.name} {car.model} ({car.plate})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vehicle Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Placa (Opcional)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={vehiclePlate}
                        onChange={(e) => handlePlateChange(e.target.value)}
                        placeholder="ABC123"
                        className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-mono font-bold uppercase text-center"
                      />
                    </div>

                    <div className="space-y-1 relative" ref={brandDropdownRef}>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Marca
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                        className={`w-full h-11 px-3 bg-[#F9FAF] border rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer ${
                          isBrandDropdownOpen ? "border-[#C9A84C] bg-white ring-1 ring-[#C9A84C]/50" : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {selectedBrandId ? (
                            (() => {
                              const b = brands.find((b) => b.id === selectedBrandId);
                              if (!b) return <span>Seleccionar...</span>;
                              return (
                                <>
                                  {b.logo && (
                                    <img
                                      src={b.logo}
                                      alt={b.name}
                                      className="h-5 w-5 object-contain rounded shrink-0 bg-white"
                                    />
                                  )}
                                  <span className="truncate font-semibold">{b.name}</span>
                                </>
                              );
                            })()
                          ) : (
                            <span className="text-zinc-400">Seleccionar...</span>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isBrandDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isBrandDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-800 z-40 animate-[fadeIn_0.15s_ease-out]">
                          <div
                            onClick={() => {
                              setSelectedBrandId("");
                              setIsBrandDropdownOpen(false);
                            }}
                            className="py-2 px-3 hover:bg-zinc-50 font-semibold cursor-pointer text-zinc-450"
                          >
                            Sin especificar
                          </div>
                          {brands.map((b) => (
                            <div
                              key={b.id}
                              onClick={() => {
                                setSelectedBrandId(b.id);
                                setIsBrandDropdownOpen(false);
                              }}
                              className={`py-2 px-3 hover:bg-zinc-50 font-semibold cursor-pointer flex items-center gap-2 ${
                                selectedBrandId === b.id ? "text-[#9A7A28] bg-[#FBF5E6]/40" : "text-zinc-700"
                              }`}
                            >
                              {b.logo && (
                                <img
                                  src={b.logo}
                                  alt={b.name}
                                  className="h-5 w-5 object-contain rounded shrink-0 bg-white border border-zinc-100"
                                />
                              )}
                              <span>{b.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Modelo / Línea
                      </label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => {
                          setVehicleModel(e.target.value);
                          setErrorMsg("");
                        }}
                        placeholder="Ej. Corolla / CX-5"
                        className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Navigation footer of step 1 */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      Continuar a Fecha y Servicios
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ==================== PASO 2: FECHA, HORA Y SERVICIOS ==================== */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
            {/* Header Accordion */}
            <div
              onClick={() => handleHeaderClick(2)}
              className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${
                activeStep === 2 ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl" : "hover:bg-zinc-50/40 rounded-xl"
              } ${!isStep1Valid ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isStep2Valid && isStep1Valid
                      ? "bg-green-100 text-green-700"
                      : activeStep === 2
                      ? "bg-[#C9A84C]/25 text-[#9A7A28]"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {isStep2Valid && isStep1Valid ? "✓" : "2"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                    Fecha, Hora y Servicios
                  </h3>
                  {activeStep !== 2 && selectedServiceIds.length > 0 && (
                    <p className="text-[11px] text-[#9A7A28] font-bold mt-0.5 truncate">
                      {scheduledDate} a las {scheduledTime} · {selectedServiceIds.length} {selectedServiceIds.length === 1 ? "servicio" : "servicios"}
                    </p>
                  )}
                </div>
              </div>
              {activeStep === 2 ? (
                <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
              ) : (
                <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />
              )}
            </div>

            {/* Content Accordion */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                activeStep === 2 ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className={activeStep === 2 ? "overflow-visible" : "overflow-hidden"}>
                <div className="p-5 space-y-5 border-t border-zinc-100 bg-white">
                  
                  {/* Scheduling Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                        Fecha de Agendamiento *
                      </label>
                      <input
                        type="date"
                        required
                        min={todayColombia}
                        value={scheduledDate}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          setScheduledDate(newDate);
                          const isSun = new Date(`${newDate}T12:00:00-05:00`).getDay() === 0;
                          const slots = getBusinessTimeSlots(newDate);
                          if (!isSun && slots.length > 0 && !slots.some(s => s.value === scheduledTime)) {
                            setScheduledTime(slots[0].value);
                          }
                          setErrorMsg("");
                        }}
                        className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                        Hora de la Cita *
                      </label>
                      {isSundaySelected ? (
                        <div className="h-11 px-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Cerrado los domingos</span>
                        </div>
                      ) : (
                        <select
                          required
                          value={scheduledTime}
                          onChange={(e) => {
                            setScheduledTime(e.target.value);
                            setErrorMsg("");
                          }}
                          className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                        >
                          {timeSlots.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Services Catalog Selection (Estilo Recepción) */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7A28] flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#C9A84C]" />
                      Servicios Disponibles *
                    </span>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-56 overflow-y-auto pr-1 py-1">
                      {services.map((s) => {
                        const isSelected = selectedServiceIds.includes(s.id);
                        const Icon = getServiceIcon(s.name, s.icon);

                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleService(s.id)}
                            className={`border rounded-xl p-3 cursor-pointer select-none transition-all duration-200 flex flex-col justify-between h-20 min-h-[50px] relative hover:shadow-2xs ${
                              isSelected
                                ? "border-[#C9A84C] bg-[#FBF5E6]/60 shadow-[0_0_0_3px_rgba(201,168,76,0.12)] text-[#9A7A28]"
                                : s.isTopSelling
                                ? "border-[#C9A84C]/35 bg-[#FBF5E6]/10 text-zinc-650 hover:border-[#C9A84C]/60 hover:bg-[#FBF5E6]/25"
                                : "border-zinc-200 bg-zinc-50/70 text-zinc-600 hover:border-zinc-350 hover:bg-zinc-100/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Icon className={`h-5 w-5 ${isSelected ? "text-[#C9A84C]" : "text-[#9A7A28]/70"}`} />
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                                  isSelected ? "bg-[#C9A84C] border-[#C9A84C]" : "border-zinc-300 bg-white"
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <span className={`text-[11px] font-bold truncate text-left ${isSelected ? "text-[#9A7A28]" : "text-zinc-800"}`}>
                              {s.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notes / Observations */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-450 block">
                      Observaciones / Notas Adicionales
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Escriba solicitudes especiales o detalles adicionales aquí..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Footer Actions of step 2 */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
                    >
                      Regresar
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending || isSundaySelected}
                        className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#b0903c] text-xs font-bold text-[#0A0A0C] transition-all cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {isPending ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <span>{initialData ? "Actualizar Reserva" : "Confirmar Reserva"}</span>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
