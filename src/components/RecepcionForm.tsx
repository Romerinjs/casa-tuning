"use client";

import { useState, useActionState, useEffect, startTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/app/(authenticated)/recepcion/actions";
import { useToast } from "@/components/ui/Toast";
import {
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  Sun,
  Shield,
  Bell,
  Volume2,
  Camera as VideoCamera,
  Lightbulb,
  Wind,
  Layers,
  HelpCircle,
  Search,
} from "lucide-react";

interface BrandData {
  id: number;
  name: string;
}

interface ServiceData {
  id: number;
  name: string;
}

interface ClientCarData {
  id: number;
  plate: string;
  model: string;
  year: number;
  brand: { id: number; name: string };
}

interface ClientData {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  cars: ClientCarData[];
}

interface CarData {
  id: number;
  plate: string;
  model: string;
  year: number;
  color: string;
  brand: { id: number; name: string };
  client: { id: number; name: string; phone: string; email: string | null };
}

interface RecepcionFormProps {
  brands: BrandData[];
  services: ServiceData[];
  existingClients?: ClientData[];
  existingCars?: CarData[];
}

export default function RecepcionForm({
  brands,
  services,
  existingClients = [],
  existingCars = [],
}: RecepcionFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // 1. Accordion Step State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // 2. Real-time form input states
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  const [plate, setPlate] = useState("");
  const [year, setYear] = useState("");
  const [brandId, setBrandId] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [mileage, setMileage] = useState("");

  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  // Toggles and Search states
  const [clientMode, setClientMode] = useState<"registered" | "new">("registered");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [selectedClientObj, setSelectedClientObj] = useState<ClientData | null>(null);

  const [carMode, setCarMode] = useState<"registered" | "new">("registered");
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [isCarSearchOpen, setIsCarSearchOpen] = useState(false);

  // Signature states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState("");

  // Custom Brand Dropdown state
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

  // 3. Local Step Errors
  const [stepError, setStepError] = useState<string | null>(null);

  // 4. Server submission state
  const [state, formAction, isPending] = useActionState(createOrderAction, null);

  // Years select range: currentYear + 1 down to 1990
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 38 }, (_, i) => currentYear + 1 - i);

  // Toggle service selection
  const toggleService = (id: number) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
    setStepError(null);
  };

  // Redirect on successful form submission
  useEffect(() => {
    if (state?.success) {
      showToast("Recepción registrada con éxito.", "success");
      router.push("/dashboard");
    } else if (state?.error) {
      showToast(state.error, "error");
    }
  }, [state, router, showToast]);

  // Configure canvas style on mount / step change
  useEffect(() => {
    if (activeStep === 4 && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#18181b"; // zinc 900
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [activeStep]);

  // Input Sanitizations in real-time
  const handlePhoneChange = (val: string) => {
    setClientPhone(val.replace(/\D/g, "").slice(0, 10));
    setStepError(null);
  };

  const handlePlateChange = (val: string) => {
    setPlate(val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6));
    setStepError(null);
  };

  const handleMileageChange = (val: string) => {
    setMileage(val.replace(/\D/g, ""));
    setStepError(null);
  };

  // Autocomplete filtering
  const filteredClientsList = existingClients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      c.phone.includes(clientSearchQuery)
  );

  const filteredCarsList = existingCars.filter((car) => {
    const matchesPlate = car.plate.toLowerCase().includes(carSearchQuery.toLowerCase());
    if (selectedClientObj) {
      return car.client.id === selectedClientObj.id && matchesPlate;
    }
    return matchesPlate;
  });

  // Canvas Drawing handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvasRef.current.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvasRef.current.height;
    return { x, y };
  };

  const getCanvasTouchCoords = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || e.touches.length === 0) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * canvasRef.current.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvasRef.current.height;
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasTouchCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCanvasTouchCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setSignatureData("");
  };

  // Map service names to Lucide icons dynamically
  const getServiceIcon = (name: string) => {
    const serviceName = name.toLowerCase();
    if (serviceName.includes("polarizado")) return Sun;
    if (serviceName.includes("ppf")) return Shield;
    if (serviceName.includes("alarma")) return Bell;
    if (serviceName.includes("sonido")) return Volume2;
    if (serviceName.includes("cámara") || serviceName.includes("camara")) return VideoCamera;
    if (serviceName.includes("led")) return Lightbulb;
    if (serviceName.includes("aire") || serviceName.includes("acond")) return Wind;
    if (serviceName.includes("accesorio")) return Layers;
    return HelpCircle;
  };

  // STEP VALIDATIONS
  const validateStep1 = () => {
    if (!clientName.trim()) {
      setStepError("El nombre completo del cliente es obligatorio.");
      return false;
    }
    if (clientPhone.length !== 10) {
      setStepError("El celular del cliente debe contener exactamente 10 números.");
      return false;
    }
    if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      setStepError("El correo electrónico ingresado no tiene un formato válido.");
      return false;
    }
    setStepError(null);
    return true;
  };

  const validateStep2 = () => {
    if (plate.length < 5 || plate.length > 6) {
      setStepError("La placa del vehículo debe contener entre 5 y 6 caracteres alfanuméricos.");
      return false;
    }
    if (!year) {
      setStepError("El año del vehículo es obligatorio.");
      return false;
    }
    if (!brandId) {
      setStepError("Debe seleccionar una marca.");
      return false;
    }
    if (!model.trim()) {
      setStepError("El modelo del vehículo es obligatorio.");
      return false;
    }
    if (!color.trim()) {
      setStepError("El color del vehículo es obligatorio.");
      return false;
    }
    setStepError(null);
    return true;
  };

  const validateStep3 = () => {
    if (selectedServices.length === 0) {
      setStepError("Debe seleccionar al menos un servicio contratado.");
      return false;
    }
    setStepError(null);
    return true;
  };

  // Navigation handlers
  const handleNextStep = (current: 1 | 2 | 3) => {
    if (current === 1 && validateStep1()) {
      setActiveStep(2);
    } else if (current === 2 && validateStep2()) {
      setActiveStep(3);
    } else if (current === 3 && validateStep3()) {
      setActiveStep(4);
    }
  };

  const handlePrevStep = (prev: 1 | 2 | 3) => {
    setStepError(null);
    setActiveStep(prev);
  };

  const handleHeaderClick = (step: 1 | 2 | 3 | 4) => {
    if (step === 1) {
      setActiveStep(1);
    } else if (step === 2 && validateStep1()) {
      setActiveStep(2);
    } else if (step === 3 && validateStep1() && validateStep2()) {
      setActiveStep(3);
    } else if (step === 4 && validateStep1() && validateStep2() && validateStep3()) {
      setActiveStep(4);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateStep1() || !validateStep2() || !validateStep3()) return;
        if (!signatureData) {
          setStepError("La firma digital del cliente es obligatoria.");
          showToast("La firma digital del cliente es obligatoria.", "warning");
          return;
        }

        const formData = new FormData();
        formData.append("clientName", clientName);
        formData.append("clientPhone", clientPhone);
        formData.append("clientEmail", clientEmail);
        formData.append("plate", plate);
        formData.append("year", year);
        formData.append("brandId", brandId);
        formData.append("model", model);
        formData.append("color", color);
        formData.append("mileage", mileage);
        formData.append("signature", signatureData);
        
        selectedServices.forEach((sId) => {
          formData.append("services", sId.toString());
        });

        startTransition(() => {
          formAction(formData);
        });
      }}
      className="flex-1 flex flex-col overflow-hidden h-full"
    >
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-6 md:px-8 flex items-center justify-between shrink-0 select-none">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-zinc-900">
            Nueva Recepción
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </header>

      {/* SECUENTIAL WORKFLOW AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-3xl mx-auto w-full">
        {/* Main server-side errors */}
        {(state?.error || stepError) && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 flex items-start gap-2.5 shadow-xs animate-[fadeIn_0.2s_ease-out]">
            <XCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div className="min-w-0">
              <p>{stepError || state?.error}</p>
            </div>
          </div>
        )}

        {/* ==================== PASO 1: DATOS DEL CLIENTE ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(1)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${
              activeStep === 1 ? "bg-zinc-50/70 border-b border-zinc-100" : "hover:bg-zinc-50/40"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  clientName && clientPhone.length === 10
                    ? "bg-green-100 text-green-700"
                    : activeStep === 1
                    ? "bg-[#C9A84C]/25 text-[#9A7A28]"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {clientName && clientPhone.length === 10 ? "✓" : "1"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                  Datos del Cliente
                </h3>
                {activeStep !== 1 && clientName && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    {clientName} · {clientPhone} {selectedClientObj && " (Registrado)"}
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

          {/* Expanded panel */}
          {activeStep === 1 && (
            <div className="p-6 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Toggle Cliente Registrado vs Nuevo */}
              <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200 w-full max-w-xs select-none">
                <button
                  type="button"
                  onClick={() => {
                    setClientMode("registered");
                    setStepError(null);
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
                    setClientName("");
                    setClientPhone("");
                    setClientEmail("");
                    setSelectedClientObj(null);
                    setStepError(null);
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

              {/* MODO BUSCAR REGISTRADO */}
              {clientMode === "registered" && (
                <div className="space-y-3 relative">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Buscar Cliente (Nombre o Celular) *
                    </label>
                    <div className="relative">
                      <Search className="absolute inset-y-0 left-3 my-auto h-4.5 w-4.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Escriba nombre o celular..."
                        value={clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setIsClientSearchOpen(true);
                        }}
                        onFocus={() => setIsClientSearchOpen(true)}
                        className="w-full h-11 pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                      />
                      {isClientSearchOpen && filteredClientsList.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsClientSearchOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-700 z-20 animate-[fadeIn_0.15s_ease-out]">
                            {filteredClientsList.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setSelectedClientObj(c);
                                  setClientName(c.name);
                                  setClientPhone(c.phone);
                                  setClientEmail(c.email || "");
                                  setClientSearchQuery("");
                                  setIsClientSearchOpen(false);
                                  setStepError(null);
                                  
                                  // Auto-fill car toggle to registered if has cars
                                  if (c.cars && c.cars.length > 0) {
                                    setCarMode("registered");
                                  } else {
                                    setCarMode("new");
                                  }
                                }}
                                className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer font-semibold transition-colors border-b border-zinc-50 last:border-b-0"
                              >
                                <div className="font-bold text-zinc-900">{c.name}</div>
                                <div className="text-[11px] text-zinc-400">{c.phone}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ficha Cliente Seleccionado */}
                  {clientPhone && (
                    <div className="p-4 bg-[#FBF5E6]/40 border border-[#C9A84C]/30 rounded-xl flex items-center justify-between animate-[fadeIn_0.2s_ease-out]">
                      <div>
                        <span className="text-xs font-bold text-[#9A7A28] uppercase tracking-wider block">
                          Cliente seleccionado
                        </span>
                        <h4 className="text-sm font-bold text-zinc-800 mt-1">{clientName}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Celular: {clientPhone} {clientEmail && `· Correo: ${clientEmail}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setClientName("");
                          setClientPhone("");
                          setClientEmail("");
                          setSelectedClientObj(null);
                        }}
                        className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-bold text-red-600 bg-white hover:bg-red-50 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* MODO NUEVO CLIENTE */}
              {clientMode === "new" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fadeIn_0.2s_ease-out]">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="clientName"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej. Carlos Andrés Restrepo"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Celular (10 dígitos) *
                    </label>
                    <input
                      type="text"
                      name="clientPhone"
                      required
                      value={clientPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="Ej. 3168858161"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Correo electrónico
                    </label>
                    <input
                      type="text"
                      name="clientEmail"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="ejemplo@correo.com (opcional)"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Navigation button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleNextStep(1)}
                  className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  Continuar al Vehículo
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== PASO 2: DATOS DEL VEHÍCULO ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(2)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${
              activeStep === 2 ? "bg-zinc-50/70 border-b border-zinc-100" : "hover:bg-zinc-50/40"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  plate.length >= 5 && year && brandId && model && color
                    ? "bg-green-100 text-green-700"
                    : activeStep === 2
                    ? "bg-[#C9A84C]/25 text-[#9A7A28]"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {plate.length >= 5 && year && brandId && model && color ? "✓" : "2"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                  Datos del Vehículo
                </h3>
                {activeStep !== 2 && plate && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                    Placa: {plate.toUpperCase()} · {model} ({year})
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

          {/* Expanded panel */}
          {activeStep === 2 && (
            <div className="p-6 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              {/* Toggle Vehículo Registrado vs Nuevo */}
              <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200 w-full max-w-xs select-none">
                <button
                  type="button"
                  onClick={() => {
                    setCarMode("registered");
                    setStepError(null);
                  }}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    carMode === "registered"
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Vehículo Existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCarMode("new");
                    setPlate("");
                    setYear("");
                    setBrandId("");
                    setModel("");
                    setColor("");
                    setStepError(null);
                  }}
                  className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    carMode === "new"
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Nuevo Vehículo
                </button>
              </div>

              {/* MODO BUSCAR VEHÍCULO REGISTRADO */}
              {carMode === "registered" && (
                <div className="space-y-3 relative">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      {selectedClientObj 
                        ? `Buscar Vehículo de ${selectedClientObj.name} (Placa) *` 
                        : "Buscar Vehículo General (Placa) *"}
                    </label>
                    <div className="relative">
                      <Search className="absolute inset-y-0 left-3 my-auto h-4.5 w-4.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Escriba la placa del vehículo..."
                        value={carSearchQuery}
                        onChange={(e) => {
                          setCarSearchQuery(e.target.value.toUpperCase());
                          setIsCarSearchOpen(true);
                        }}
                        onFocus={() => setIsCarSearchOpen(true)}
                        className="w-full h-11 pl-10 pr-4 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-mono tracking-wider"
                      />
                      {isCarSearchOpen && filteredCarsList.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsCarSearchOpen(false)} />
                          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-700 z-20 animate-[fadeIn_0.15s_ease-out]">
                            {filteredCarsList.map((car) => (
                              <div
                                key={car.id}
                                onClick={() => {
                                  setPlate(car.plate);
                                  setYear(car.year.toString());
                                  setBrandId(car.brand.id.toString());
                                  setModel(car.model);
                                  setColor(car.color);
                                  setCarSearchQuery("");
                                  setIsCarSearchOpen(false);
                                  setStepError(null);
                                  
                                  // Auto-fill client if new/empty
                                  if (!clientPhone) {
                                    setClientName(car.client.name);
                                    setClientPhone(car.client.phone);
                                    setClientEmail(car.client.email || "");
                                    setClientMode("registered");
                                  }
                                }}
                                className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer font-semibold transition-colors flex items-center justify-between border-b border-zinc-50 last:border-b-0"
                              >
                                <div>
                                  <div className="font-bold text-zinc-900">{car.brand.name} {car.model} ({car.year})</div>
                                  <div className="text-[11px] text-zinc-400">Dueño: {car.client.name}</div>
                                </div>
                                <span className="font-mono font-bold text-xs bg-zinc-100 border border-zinc-300 rounded px-2 py-0.5 tracking-wider text-zinc-800">
                                  {car.plate}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ficha Vehículo Seleccionado */}
                  {plate && (
                    <div className="p-4 bg-[#FBF5E6]/40 border border-[#C9A84C]/30 rounded-xl flex items-center justify-between animate-[fadeIn_0.2s_ease-out]">
                      <div>
                        <span className="text-xs font-bold text-[#9A7A28] uppercase tracking-wider block">
                          Vehículo seleccionado
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono font-bold text-xs bg-zinc-200 border border-zinc-350 rounded px-2 py-0.5 tracking-wider text-zinc-800">
                            {plate}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-800">
                            {brandId ? brands.find(b => b.id.toString() === brandId)?.name : ""} {model} ({year})
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">Color: {color}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPlate("");
                          setYear("");
                          setBrandId("");
                          setModel("");
                          setColor("");
                        }}
                        className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-bold text-red-600 bg-white hover:bg-red-50 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  )}

                  {/* Campo de Kilometraje obligatorio para vehículo existente */}
                  <div className="space-y-1 w-full max-w-xs pt-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Kilometraje actual (Solo enteros)
                    </label>
                    <input
                      type="text"
                      name="mileage"
                      value={mileage}
                      onChange={(e) => handleMileageChange(e.target.value)}
                      placeholder="Ej. 12500"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* MODO NUEVO VEHÍCULO */}
              {carMode === "new" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-[fadeIn_0.2s_ease-out]">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Placa (Sin espacios, máx. 6) *
                    </label>
                    <input
                      type="text"
                      name="plate"
                      required
                      value={plate}
                      onChange={(e) => handlePlateChange(e.target.value)}
                      placeholder="AAA000"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono font-bold uppercase tracking-wider text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Año *
                    </label>
                    <select
                      name="year"
                      required
                      value={year}
                      onChange={(e) => {
                        setYear(e.target.value);
                        setStepError(null);
                      }}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="">Seleccionar año...</option>
                      {yearsList.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Styled Brand Selector Dropdown */}
                  <div className="space-y-1 col-span-2 sm:col-span-1 relative">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Marca *
                    </label>
                    <input type="hidden" name="brandId" value={brandId} required />
                    <button
                      type="button"
                      onClick={() => {
                        setIsBrandDropdownOpen(!isBrandDropdownOpen);
                        setStepError(null);
                      }}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        {brandId
                          ? brands.find((b) => b.id.toString() === brandId)?.name || "Seleccionar..."
                          : "Seleccionar..."}
                      </span>
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    </button>

                    {isBrandDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setIsBrandDropdownOpen(false)}
                        />
                        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-800 z-40 animate-[fadeIn_0.15s_ease-out]">
                          {brands.map((brand) => (
                            <div
                              key={brand.id}
                              onClick={() => {
                                setBrandId(brand.id.toString());
                                setIsBrandDropdownOpen(false);
                              }}
                              className={`py-2.5 px-3 hover:bg-zinc-50 font-semibold cursor-pointer transition-colors select-none ${
                                brandId === brand.id.toString()
                                  ? "text-[#9A7A28] bg-[#FBF5E6]/40"
                                  : "text-zinc-700"
                              }`}
                            >
                              {brand.name}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      name="model"
                      required
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Ej. Picanto"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Color *
                    </label>
                    <input
                      type="text"
                      name="color"
                      required
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="Ej. Blanco perla"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Kilometraje (Solo enteros)
                    </label>
                    <input
                      type="text"
                      name="mileage"
                      value={mileage}
                      onChange={(e) => handleMileageChange(e.target.value)}
                      placeholder="Ej. 12500"
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handlePrevStep(1)}
                  className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(2)}
                  className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  Continuar a Servicios
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== PASO 3: SERVICIOS CONTRATADOS ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(3)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${
              activeStep === 3 ? "bg-zinc-50/70 border-b border-zinc-100" : "hover:bg-zinc-50/40"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  selectedServices.length > 0
                    ? "bg-green-100 text-green-700"
                    : activeStep === 3
                    ? "bg-[#C9A84C]/25 text-[#9A7A28]"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {selectedServices.length > 0 ? "✓" : "3"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                  Servicios Contratados
                </h3>
                {activeStep !== 3 && selectedServices.length > 0 && (
                  <p className="text-[11px] text-[#9A7A28] font-bold mt-0.5 truncate">
                    {selectedServices.length}{" "}
                    {selectedServices.length === 1 ? "servicio seleccionado" : "servicios seleccionados"}
                  </p>
                )}
              </div>
            </div>
            {activeStep === 3 ? (
              <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />
            )}
          </div>

          {/* Expanded panel */}
          {activeStep === 3 && (
            <div className="p-6 space-y-4 animate-[fadeIn_0.2s_ease-out]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  const Icon = getServiceIcon(service.name);

                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`border rounded-xl p-3 cursor-pointer select-none transition-all duration-150 flex flex-col justify-between h-20 min-h-[50px] relative ${
                        isSelected
                          ? "border-[#C9A84C] bg-[#FBF5E6]/60 shadow-[0_0_0_3px_rgba(201,168,76,0.12)] text-[#9A7A28]"
                          : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-[#C9A84C]/60 hover:bg-[#FBF5E6]/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon
                          className={`h-5 w-5 ${isSelected ? "text-[#C9A84C]" : "text-zinc-400"}`}
                        />
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                            isSelected ? "bg-[#C9A84C] border-[#C9A84C]" : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <span className={`text-xs font-bold truncate ${isSelected ? "text-[#9A7A28]" : "text-zinc-700"}`}>
                        {service.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handlePrevStep(2)}
                  className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="button"
                  onClick={() => handleNextStep(3)}
                  className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  Continuar a Inspección
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== PASO 4: FOTOS Y FIRMA DE RECEPCIÓN ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(4)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${
              activeStep === 4 ? "bg-zinc-50/70 border-b border-zinc-100" : "hover:bg-zinc-50/40"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  activeStep === 4 ? "bg-[#C9A84C]/25 text-[#9A7A28]" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {signatureData ? "✓" : "4"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                  Inspección y Firma de Recepción
                </h3>
              </div>
            </div>
            {activeStep === 4 ? (
              <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />
            )}
          </div>

          {/* Expanded panel */}
          {activeStep === 4 && (
            <div className="p-6 space-y-6 animate-[fadeIn_0.2s_ease-out]">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Fotos de Recepción (Demo)
                </h4>
                <p className="text-xs text-zinc-400">
                  Carga de maquetas fotográficas del estado del vehículo.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div
                      key={num}
                      className="aspect-square rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex flex-col items-center justify-center gap-1 cursor-not-allowed select-none transition-colors group"
                    >
                      <ImageIcon className="h-5 w-5 text-zinc-400 group-hover:text-zinc-500" />
                      <span className="text-[9px] text-zinc-400 font-medium">Foto {num}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Firma del Cliente Canvas */}
              <div className="pt-5 border-t border-zinc-150 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-zinc-600" />
                  <span className="text-sm font-bold text-zinc-805">Firma Digital del Cliente *</span>
                </div>
                <p className="text-xs text-zinc-500">
                  El cliente confirma que el estado del vehículo y los servicios contratados fueron revisados y aceptados.
                </p>
                
                <div 
                  className="border border-zinc-250 rounded-xl bg-white overflow-hidden relative h-32 w-full max-w-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawingTouch}
                    onTouchMove={drawTouch}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  {signatureData && (
                    <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-[9px] font-bold px-2.5 py-0.5 rounded-full border border-green-200">
                      Firmado ✓
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center w-full max-w-lg">
                  <span className="text-[10px] text-zinc-400">Dibuja tu firma sobre el lienzo</span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-red-500 transition-colors"
                  >
                    Limpiar firma
                  </button>
                </div>
                <input type="hidden" name="signature" value={signatureData} />
              </div>

              {/* Navigation and Final Submit */}
              <div className="flex justify-between pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => handlePrevStep(3)}
                  className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirmar y Registrar Recepción
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
