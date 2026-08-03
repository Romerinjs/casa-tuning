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
  Palette,
  ShieldAlert,
  Compass,
  Radar,
  Radio,
  Smartphone,
  Speaker,
  Sliders,
  Tv,
  Sparkles,
  Trash2,
  UploadCloud,
  Plus,
  User,
} from "lucide-react";

interface BrandData {
  id: number;
  name: string;
  logo?: string | null;
}

interface ServiceData {
  id: number;
  name: string;
  isActive: boolean;
  icon?: string | null;
  isTopSelling: boolean;
}

interface ClientCarData {
  id: number;
  plate: string;
  model: string;
  year: number;
  brand: { id: number; name: string; logo?: string | null };
}

interface ClientData {
  id: number;
  name: string;
  phone: string;
  phone2?: string | null;
  documentNumber?: string | null;
  documentTypeId?: number | null;
  documentType?: { id: number; code: string; name: string } | null;
  email: string | null;
  photoUrl?: string | null;
  cars: ClientCarData[];
}

interface CarData {
  id: number;
  plate: string;
  type?: string;
  model: string;
  year: number;
  color: string;
  brand: { id: number; name: string; logo?: string | null };
  client: {
    id: number;
    name: string;
    phone: string;
    phone2?: string | null;
    documentNumber?: string | null;
    documentTypeId?: number | null;
    documentType?: { id: number; code: string; name: string } | null;
    email: string | null;
    photoUrl?: string | null;
  };
}

interface DocumentTypeData {
  id: number;
  code: string;
  name: string;
}

interface RecepcionFormProps {
  brands: BrandData[];
  services: ServiceData[];
  existingClients?: ClientData[];
  existingCars?: CarData[];
  documentTypes: DocumentTypeData[];
  initialOrder?: any;
  initialReservation?: any;
}

interface ObservationsTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

function ObservationsTextarea({
  value,
  onChange,
  placeholder,
  rows,
  className,
}: ObservationsTextareaProps) {
  const [localValue, setLocalValue] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const localValueRef = useRef(localValue);
  localValueRef.current = localValue;

  // Keep local state in sync if parent value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Update parent state when input loses focus
  const handleBlur = () => {
    onChangeRef.current(localValueRef.current);
  };

  // Update parent state on unmount (e.g., user navigates steps or clicks button without blurring)
  useEffect(() => {
    return () => {
      onChangeRef.current(localValueRef.current);
    };
  }, []);

  return (
    <textarea
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
      }}
      onBlur={handleBlur}
      placeholder={placeholder}
      rows={rows}
      className={className}
    />
  );
}

export default function RecepcionForm({
  brands,
  services,
  existingClients = [],
  existingCars = [],
  documentTypes = [],
  initialOrder,
  initialReservation,
}: RecepcionFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // 1. Accordion Step State
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // 2. Real-time form input states
  const [clientName, setClientName] = useState(
    initialOrder?.client?.name || initialReservation?.client?.name || ""
  );
  const [clientPhone, setClientPhone] = useState(
    initialOrder?.client?.phone || initialReservation?.client?.phone || ""
  );
  const [clientPhone2, setClientPhone2] = useState(initialOrder?.client?.phone2 || "");
  const [showPhone2, setShowPhone2] = useState(!!initialOrder?.client?.phone2);
  const [clientDocumentTypeId, setClientDocumentTypeId] = useState(
    initialOrder?.client?.documentTypeId
      ? initialOrder.client.documentTypeId.toString()
      : initialReservation?.client?.documentTypeId
      ? initialReservation.client.documentTypeId.toString()
      : ""
  );
  const [clientDocumentNumber, setClientDocumentNumber] = useState(
    initialOrder?.client?.documentNumber || initialReservation?.client?.documentNumber || ""
  );
  const [clientEmail, setClientEmail] = useState(
    initialOrder?.client?.email || initialReservation?.client?.email || ""
  );

  const [plate, setPlate] = useState(
    initialOrder?.car?.plate || initialReservation?.car?.plate || initialReservation?.vehiclePlate || ""
  );
  const [year, setYear] = useState(
    initialOrder?.car?.year
      ? initialOrder.car.year.toString()
      : initialReservation?.car?.year
      ? initialReservation.car.year.toString()
      : ""
  );
  const [brandId, setBrandId] = useState(
    initialOrder?.car?.brandId
      ? initialOrder.car.brandId.toString()
      : initialReservation?.car?.brandId
      ? initialReservation.car.brandId.toString()
      : initialReservation?.brandId
      ? initialReservation.brandId.toString()
      : ""
  );
  const [model, setModel] = useState(
    initialOrder?.car?.model || initialReservation?.car?.model || initialReservation?.vehicleModel || ""
  );
  const [color, setColor] = useState(initialOrder?.car?.color || "");
  const [mileage, setMileage] = useState(initialOrder?.mileage || "");
  const [vehicleType, setVehicleType] = useState(initialOrder?.car?.type || "Automóvil");

  const [selectedServices, setSelectedServices] = useState<number[]>(
    initialOrder?.services?.map((s: any) => s.serviceId) ||
      initialReservation?.services?.map((s: any) => s.serviceId) ||
      []
  );
  const [serviceDescription, setServiceDescription] = useState(initialOrder?.serviceDescription || "");

  const [observations, setObservations] = useState(
    initialOrder?.observations || initialReservation?.notes || ""
  );

  // Extract initial checklist values and images
  const initialChecklist: Record<string, string> = {
    rayones: "no",
    golpes: "no",
    pintura: "bueno",
    rines: "bueno",
    vidrios: "bueno",
    parabrisas: "bueno",
    farolas: "bueno",
    cojineria: "bueno",
    tablero: "bueno",
    general_interior: "bueno",
    testigos: "bueno",
    vidrios_electricos: "bueno",
    luces: "bueno",
    direccionales: "bueno",
    reversa: "bueno",
    estacionarias: "bueno",
    pito: "bueno",
    plumillas: "bueno",
    espejos: "bueno",
    lineas_termicas: "bueno",
  };

  const initialChecklistImages: Record<string, string[]> = {};

  if (initialOrder?.checklist && typeof initialOrder.checklist === "object") {
    Object.entries(initialOrder.checklist as Record<string, any>).forEach(([key, val]) => {
      if (key.startsWith("_images_")) {
        initialChecklistImages[key.replace("_images_", "")] = val;
      } else {
        initialChecklist[key] = val;
      }
    });
  }

  const [checklist, setChecklist] = useState<Record<string, string>>(initialChecklist);
  const [checklistImages, setChecklistImages] = useState<Record<string, string[]>>(initialChecklistImages);
  const [activeGalleryKey, setActiveGalleryKey] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<{ key: string; index: number } | null>(null);
  const [armedImage, setArmedImage] = useState<{ key: string; index: number } | null>(null);

  const handleImageUpload = (key: string, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const img = new Image();
          img.src = reader.result;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDimension = 1280;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
              setChecklistImages((prev) => ({
                ...prev,
                [key]: [...(prev[key] || []), compressedBase64],
              }));
            }
          };
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Toggles and Search states
  const [clientMode, setClientMode] = useState<"registered" | "new">(initialOrder ? "new" : "registered");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [selectedClientObj, setSelectedClientObj] = useState<ClientData | null>(null);

  const [carMode, setCarMode] = useState<"registered" | "new">(initialOrder ? "new" : "registered");
  const [carSearchQuery, setCarSearchQuery] = useState("");
  const [isCarSearchOpen, setIsCarSearchOpen] = useState(false);

  // Signature states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(initialOrder?.signatureUrl || "");
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Refs for click outside to close dropdowns
  const clientSearchRef = useRef<HTMLDivElement>(null);
  const carSearchRef = useRef<HTMLDivElement>(null);
  const docTypeDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Dropdown states
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isDocTypeDropdownOpen, setIsDocTypeDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Close dropdowns when clicking/tapping outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        clientSearchRef.current &&
        !clientSearchRef.current.contains(event.target as Node)
      ) {
        setIsClientSearchOpen(false);
      }
      if (
        carSearchRef.current &&
        !carSearchRef.current.contains(event.target as Node)
      ) {
        setIsCarSearchOpen(false);
      }
      if (
        docTypeDropdownRef.current &&
        !docTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDocTypeDropdownOpen(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setIsYearDropdownOpen(false);
      }
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBrandDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

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

  // Configure canvas style on mount / step change with delay for grid expansion transition
  useEffect(() => {
    if (activeStep === 5) {
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const targetWidth = canvas.offsetWidth * 2;
          const targetHeight = canvas.offsetHeight * 2;

          const sizeChanged = canvas.width !== targetWidth || canvas.height !== targetHeight;
          if (sizeChanged) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
          }

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.strokeStyle = "#18181b"; // zinc 900
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            if (sizeChanged && signatureData) {
              const img = new Image();
              img.src = signatureData;
              img.onload = () => {
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              };
            }
          }
        }
      }, 350); // wait for 300ms CSS grid transition to complete
      return () => clearTimeout(timer);
    }
  }, [activeStep, signatureData]);
  // Adjust checklist defaults based on vehicleType selection (Automóvil vs Motocicleta)
  useEffect(() => {
    if (vehicleType === "Motocicleta") {
      setChecklist((prev) => ({
        ...prev,
        vidrios: "na",
        general_interior: "na",
        parabrisas: "na",
        vidrios_electricos: "na",
        plumillas: "na",
        lineas_termicas: "na",
        estacionarias: "na",
      }));
    } else {
      setChecklist((prev) => ({
        ...prev,
        vidrios: "bueno",
        general_interior: "bueno",
        parabrisas: "bueno",
        vidrios_electricos: "bueno",
        plumillas: "bueno",
        lineas_termicas: "bueno",
        estacionarias: "bueno",
      }));
    }
  }, [vehicleType]);

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
    if (showPhone2 && clientPhone2.trim() && clientPhone2.replace(/\D/g, "").length !== 10) {
      setStepError("El celular alternativo debe contener exactamente 10 números.");
      return false;
    }
    if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      setStepError("El correo electrónico ingresado no tiene un formato válido.");
      return false;
    }
    if ((clientDocumentNumber.trim() && !clientDocumentTypeId) || (!clientDocumentNumber.trim() && clientDocumentTypeId)) {
      setStepError("Si ingresa información de documento, debe seleccionar el tipo y el número de documento.");
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

  const validateStep4 = () => {
    setStepError(null);
    return true;
  };

  // Navigation handlers
  const handleNextStep = (current: 1 | 2 | 3 | 4) => {
    if (current === 1 && validateStep1()) {
      setActiveStep(2);
    } else if (current === 2 && validateStep2()) {
      setActiveStep(3);
    } else if (current === 3 && validateStep3()) {
      setActiveStep(4);
    } else if (current === 4 && validateStep4()) {
      setActiveStep(5);
    }
  };

  const handlePrevStep = (prev: 1 | 2 | 3 | 4) => {
    setStepError(null);
    setActiveStep(prev);
  };

  const handleHeaderClick = (step: 1 | 2 | 3 | 4 | 5) => {
    if (step === 1) {
      setActiveStep(1);
    } else if (step === 2 && validateStep1()) {
      setActiveStep(2);
    } else if (step === 3 && validateStep1() && validateStep2()) {
      setActiveStep(3);
    } else if (step === 4 && validateStep1() && validateStep2() && validateStep3()) {
      setActiveStep(4);
    } else if (step === 5) {
      setActiveStep(5);
    }
  };

  // Render helper for checklist items
  const renderChecklistItem = (key: string, label: string) => {
    const isBinary = key === "rayones" || key === "golpes";
    const val = checklist[key] || (isBinary ? "no" : "bueno");
    const isFailure = isBinary ? val === "si" : val === "malo";
    const images = checklistImages[key] || [];

    return (
      <div key={key} className="py-2 border-b border-zinc-105 last:border-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-700">{label}</span>
          <div className="flex bg-zinc-100 rounded-lg p-0.5 border border-zinc-200 select-none shrink-0 scale-90 sm:scale-100 origin-right">
            {isBinary ? (
              <>
                <button
                  type="button"
                  onClick={() => setChecklist((prev) => ({ ...prev, [key]: "si" }))}
                  className={`px-3.5 py-1 rounded-md text-[9px] font-bold tracking-wider transition-all uppercase select-none cursor-pointer ${val === "si"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setChecklist((prev) => ({ ...prev, [key]: "no" }))}
                  className={`px-3.5 py-1 rounded-md text-[9px] font-bold tracking-wider transition-all uppercase select-none cursor-pointer ${val === "no"
                    ? "bg-green-600 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  No
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setChecklist((prev) => ({ ...prev, [key]: "bueno" }))}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider transition-all uppercase select-none cursor-pointer ${val === "bueno"
                    ? "bg-green-600 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Bueno
                </button>
                <button
                  type="button"
                  onClick={() => setChecklist((prev) => ({ ...prev, [key]: "malo" }))}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider transition-all uppercase select-none cursor-pointer ${val === "malo"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  Malo
                </button>
                <button
                  type="button"
                  onClick={() => setChecklist((prev) => ({ ...prev, [key]: "na" }))}
                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold tracking-wider transition-all uppercase select-none cursor-pointer ${val === "na"
                    ? "bg-zinc-400 text-white shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                    }`}
                >
                  N/A
                </button>
              </>
            )}
          </div>
        </div>

        {isFailure && (
          <div className="mt-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 animate-[fadeIn_0.2s_ease-out]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Añadir evidencias
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {/* Image thumbnails */}
              {images.length <= 3 ? (
                images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const isTouch = typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches;
                      if (!isTouch) {
                        setImageToDelete({ key, index: idx });
                      } else {
                        if (armedImage?.key === key && armedImage?.index === idx) {
                          setImageToDelete({ key, index: idx });
                        } else {
                          setArmedImage({ key, index: idx });
                        }
                      }
                    }}
                    className="h-14 w-14 rounded-xl overflow-hidden bg-zinc-150 border border-zinc-200 relative group cursor-pointer shrink-0"
                    title="Clic en PC, dos toques en móvil para eliminar"
                  >
                    <img src={imgUrl} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${(armedImage?.key === key && armedImage?.index === idx)
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                      }`}>
                      <Trash2 className="h-4.5 w-4.5 text-white" />
                    </div>
                  </div>
                ))
              ) : (
                <>
                  {/* First 2 thumbnails normally */}
                  {images.slice(0, 2).map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const isTouch = typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches;
                        if (!isTouch) {
                          setImageToDelete({ key, index: idx });
                        } else {
                          if (armedImage?.key === key && armedImage?.index === idx) {
                            setImageToDelete({ key, index: idx });
                          } else {
                            setArmedImage({ key, index: idx });
                          }
                        }
                      }}
                      className="h-14 w-14 rounded-xl overflow-hidden bg-zinc-150 border border-zinc-200 relative group cursor-pointer shrink-0"
                      title="Clic en PC, dos toques en móvil para eliminar"
                    >
                      <img src={imgUrl} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${(armedImage?.key === key && armedImage?.index === idx)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                        }`}>
                        <Trash2 className="h-4.5 w-4.5 text-white" />
                      </div>
                    </div>
                  ))}
                  {/* 3rd thumbnail with count overlay */}
                  <div
                    onClick={() => setActiveGalleryKey(key)}
                    className="h-14 w-14 rounded-xl overflow-hidden bg-zinc-150 border border-zinc-200 relative cursor-pointer shrink-0"
                  >
                    <img src={images[2]} className="w-full h-full object-cover blur-[1px]" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-xs font-extrabold font-sans">
                        +{images.length - 2}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Upload button */}
              <label className="h-14 w-14 rounded-xl border-2 border-dashed border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 flex items-center justify-center cursor-pointer shrink-0 transition-colors relative">
                <Plus className="h-5 w-5 text-zinc-400" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => handleImageUpload(key, e.target.files)}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4()) return;
        if (!acceptTerms) {
          setStepError("Primero debes aceptar los terminos y condiciones.");
          showToast("Primero debes aceptar los terminos y condiciones.", "warning");
          return;
        }

        const formData = new FormData();
        if (initialOrder) {
          formData.append("orderId", initialOrder.id.toString());
        }
        if (initialReservation) {
          formData.append("reservationId", initialReservation.id.toString());
        }
        formData.append("clientName", clientName);
        formData.append("clientPhone", clientPhone);
        formData.append("clientPhone2", showPhone2 ? clientPhone2 : "");
        formData.append("clientDocumentTypeId", clientDocumentTypeId);
        formData.append("clientDocumentNumber", clientDocumentNumber);
        formData.append("clientEmail", clientEmail);
        formData.append("plate", plate);
        formData.append("year", year);
        formData.append("brandId", brandId);
        formData.append("model", model);
        formData.append("color", color);
        formData.append("mileage", mileage);
        formData.append("vehicleType", vehicleType);
        formData.append("observations", observations);
        formData.append("serviceDescription", serviceDescription);

        // Serializar el checklist con las imágenes asociadas a los fallos
        const checklistWithImages: Record<string, any> = { ...checklist };
        Object.entries(checklistImages).forEach(([key, imgs]) => {
          const val = checklist[key];
          const isBinary = key === "rayones" || key === "golpes";
          const isFailure = isBinary ? val === "si" : val === "malo";
          if (isFailure && imgs && imgs.length > 0) {
            checklistWithImages[`_images_${key}`] = imgs;
          }
        });
        formData.append("checklist", JSON.stringify(checklistWithImages));
        formData.append("signature", signatureData);

        selectedServices.forEach((sId) => {
          formData.append("services", sId.toString());
        });

        // Check payload size before submitting (8MB limit is 8 * 1024 * 1024 bytes)
        let totalBytes = 0;
        for (const [key, value] of formData.entries()) {
          if (typeof value === "string") {
            totalBytes += value.length;
          } else if (value instanceof File) {
            totalBytes += value.size;
          }
        }

        if (totalBytes > 8 * 1024 * 1024) {
          setStepError("El tamaño total de las imágenes y datos de la recepción supera el límite de 8MB. Por favor use fotos de menor tamaño o cargue menos imágenes.");
          showToast("El tamaño total del formulario supera los 8MB.", "warning");
          return;
        }

        startTransition(async () => {
          try {
            await formAction(formData);
          } catch (err: any) {
            console.error("Error submitting form action:", err);
            const msg = err?.message || "Ocurrió un error al enviar la información.";
            setStepError(`Error de envío: ${msg}`);
            showToast(`Error al enviar el formulario: ${msg}`, "error");
          }
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
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(1)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${activeStep === 1
              ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl"
              : "hover:bg-zinc-50/40 rounded-xl"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${clientName && clientPhone.length === 10
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
          <div
            className={`grid transition-all duration-300 ease-in-out ${activeStep === 1
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
          >
            <div className={activeStep === 1 ? "overflow-visible" : "overflow-hidden"}>
              <div className="p-6 space-y-4">
                {/* Toggle Cliente Registrado vs Nuevo */}
                <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200 w-full max-w-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setClientMode("registered");
                      setStepError(null);
                    }}
                    className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${clientMode === "registered"
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
                      setCarMode("new");
                      setClientName("");
                      setClientPhone("");
                      setClientEmail("");
                      setSelectedClientObj(null);
                      setStepError(null);
                    }}
                    className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${clientMode === "new"
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
                      <div className="relative" ref={clientSearchRef}>
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
                            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-700 z-20 animate-[fadeIn_0.15s_ease-out]">
                              {filteredClientsList.map((c) => (
                                <div
                                  key={c.id}
                                  onClick={() => {
                                    setSelectedClientObj(c);
                                    setClientName(c.name);
                                    setClientPhone(c.phone);
                                    setClientEmail(c.email || "");
                                    setClientDocumentTypeId(c.documentTypeId ? c.documentTypeId.toString() : "");
                                    setClientDocumentNumber(c.documentNumber || "");
                                    setClientPhone2(c.phone2 || "");
                                    setShowPhone2(!!c.phone2);
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
                                  className="py-2.5 px-3 hover:bg-zinc-50 cursor-pointer font-semibold transition-colors border-b border-zinc-50 last:border-b-0 flex items-center gap-3"
                                >
                                  {c.photoUrl ? (
                                    <img
                                      src={c.photoUrl}
                                      alt={c.name}
                                      className="h-8 w-8 rounded-lg object-cover border border-zinc-200 shrink-0 shadow-2xs"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-[#9A7A28] border border-zinc-200 shrink-0">
                                      <User className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-zinc-900">{c.name}</div>
                                    <div className="text-[11px] text-zinc-400">{c.phone}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Ficha Cliente Seleccionado */}
                    {clientPhone && (
                      <div className="p-4 bg-[#FBF5E6]/40 border border-[#C9A84C]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[fadeIn_0.2s_ease-out]">
                        <div className="flex items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto">
                          {selectedClientObj?.photoUrl ? (
                            <img
                              src={selectedClientObj.photoUrl}
                              alt={clientName}
                              className="h-10 w-10 rounded-xl object-cover border border-zinc-200 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-[#9A7A28] border border-zinc-200 shrink-0">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-[#9A7A28] uppercase tracking-wider block">
                              Cliente seleccionado
                            </span>
                            <h4 className="text-sm font-bold text-zinc-800 mt-1 truncate">{clientName}</h4>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-zinc-500 mt-0.5 min-w-0">
                              <span className="shrink-0">Celular: {clientPhone}</span>
                              {clientPhone2 && <span className="shrink-0">· Alt: {clientPhone2}</span>}
                              {(() => {
                                if (!clientDocumentNumber) return null;
                                const docTypeObj = documentTypes.find(dt => dt.id.toString() === clientDocumentTypeId);
                                const docLabel = docTypeObj ? docTypeObj.code : "Documento";
                                return <span className="shrink-0">· {docLabel}: {clientDocumentNumber}</span>;
                              })()}
                              {clientEmail && <span className="break-all">· Correo: {clientEmail}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setClientName("");
                            setClientPhone("");
                            setClientPhone2("");
                            setClientDocumentTypeId("");
                            setClientDocumentNumber("");
                            setClientEmail("");
                            setShowPhone2(false);
                            setSelectedClientObj(null);
                          }}
                          className="h-8 px-4 rounded-lg border border-zinc-200 text-xs font-bold text-red-655 bg-white hover:bg-red-50 transition-all cursor-pointer active:scale-98 shrink-0 self-end sm:self-auto"
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
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Nombre completo
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

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Tipo Doc.
                        </label>
                        <input type="hidden" name="clientDocumentTypeId" value={clientDocumentTypeId} />
                        <div className="relative" ref={docTypeDropdownRef}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsDocTypeDropdownOpen(!isDocTypeDropdownOpen);
                              setStepError(null);
                            }}
                            className={`w-full h-11 px-2.5 bg-zinc-50 border rounded-lg text-sm text-zinc-805 transition-all flex items-center justify-between cursor-pointer ${isDocTypeDropdownOpen
                              ? "border-[#C9A84C] bg-white ring-1 ring-[#C9A84C]/50"
                              : "border-zinc-200 hover:border-zinc-300"
                              }`}
                          >
                            <span className="truncate">
                              {clientDocumentTypeId
                                ? documentTypes.find((dt) => dt.id.toString() === clientDocumentTypeId)?.code || "Sel..."
                                : "Sel..."}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-205 ${isDocTypeDropdownOpen ? "rotate-180" : ""}`} />
                          </button>

                          {isDocTypeDropdownOpen && (
                            <>
                              <div className="absolute left-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-800 z-40 animate-[fadeIn_0.15s_ease-out] min-w-[140px] max-w-[200px]">
                                <div
                                  onClick={() => {
                                    setClientDocumentTypeId("");
                                    setIsDocTypeDropdownOpen(false);
                                  }}
                                  className={`py-2 px-3 hover:bg-zinc-50 font-semibold cursor-pointer transition-colors select-none text-zinc-400`}
                                >
                                  Sel...
                                </div>
                                {documentTypes.map((dt) => (
                                  <div
                                    key={dt.id}
                                    onClick={() => {
                                      setClientDocumentTypeId(dt.id.toString());
                                      setIsDocTypeDropdownOpen(false);
                                    }}
                                    className={`py-2 px-3 hover:bg-zinc-50 font-semibold cursor-pointer transition-colors select-none ${clientDocumentTypeId === dt.id.toString()
                                      ? "text-[#9A7A28] bg-[#FBF5E6]/40"
                                      : "text-zinc-700"
                                      }`}
                                  >
                                    {dt.code} - {dt.name}
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Número de Documento
                        </label>
                        <input
                          type="text"
                          name="clientDocumentNumber"
                          value={clientDocumentNumber}
                          autoComplete="off"
                          onChange={(e) => {
                            setClientDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                            setStepError(null);
                          }}
                          placeholder="Ej. 1045238910"
                          className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Celular
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

                    {/* Toggle Teléfono Alternativo */}
                    <div className="md:col-span-2 pt-1">
                      {!showPhone2 ? (
                        <button
                          type="button"
                          onClick={() => setShowPhone2(true)}
                          className="text-xs font-semibold text-[#9A7A28] hover:text-[#C9A84C] transition-colors flex items-center gap-1"
                        >
                          + Añadir teléfono alternativo
                        </button>
                      ) : (
                        <div className="space-y-1 animate-[fadeIn_0.15s_ease-out]">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Celular alternativo (10 dígitos)
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setShowPhone2(false);
                                setClientPhone2("");
                              }}
                              className="text-[10px] font-semibold text-red-500 hover:text-red-700 transition-colors"
                            >
                              Remover celular alternativo
                            </button>
                          </div>
                          <input
                            type="text"
                            name="clientPhone2"
                            value={clientPhone2}
                            onChange={(e) => setClientPhone2(e.target.value.replace(/\D/g, "").slice(0, 10))}
                            placeholder="Ej. 3105554433"
                            className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                          />
                        </div>
                      )}
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
            </div>
          </div>
        </div>

        {/* ==================== PASO 2: DATOS DEL VEHÍCULO ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(2)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${activeStep === 2
              ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl"
              : "hover:bg-zinc-50/40 rounded-xl"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${plate.length >= 5 && year && brandId && model && color
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
          <div
            className={`grid transition-all duration-300 ease-in-out ${activeStep === 2
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
          >
            <div className={activeStep === 2 ? "overflow-visible" : "overflow-hidden"}>
              <div className="p-6 space-y-4">
                {/* Toggle Vehículo Registrado vs Nuevo */}
                <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200 w-full max-w-xs">
                  <button
                    type="button"
                    disabled={clientMode === "new"}
                    onClick={() => {
                      setCarMode("registered");
                      setStepError(null);
                    }}
                    className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${carMode === "registered"
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900"
                      } ${clientMode === "new" ? "opacity-40 cursor-not-allowed" : ""}`}
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
                    className={`flex-1 text-center py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${carMode === "new"
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
                      <div className="relative" ref={carSearchRef}>
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
                                    setVehicleType(car.type || "Automóvil");
                                    setCarSearchQuery("");
                                    setIsCarSearchOpen(false);
                                    setStepError(null);

                                    // Auto-fill client if new/empty
                                    if (!clientPhone) {
                                      setClientName(car.client.name);
                                      setClientPhone(car.client.phone);
                                      setClientPhone2(car.client.phone2 || "");
                                      setClientDocumentTypeId(car.client.documentTypeId ? car.client.documentTypeId.toString() : "");
                                      setClientDocumentNumber(car.client.documentNumber || "");
                                      setShowPhone2(!!car.client.phone2);
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
                      <div className="p-4 bg-[#FBF5E6]/40 border border-[#C9A84C]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[fadeIn_0.2s_ease-out]">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#9A7A28] uppercase tracking-wider block">
                            Vehículo seleccionado
                          </span>
                          <div className="flex flex-wrap items-center gap-2 mt-1 min-w-0">
                            <span className="font-mono font-bold text-xs bg-zinc-200 border border-zinc-350 rounded px-2 py-0.5 tracking-wider text-zinc-800 shrink-0">
                              {plate}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-800 truncate">
                              {brandId ? brands.find(b => b.id.toString() === brandId)?.name : ""} {model} ({year})
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">Tipo: {vehicleType} · Color: {color}</p>
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
                          className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-bold text-red-600 bg-white hover:bg-red-50 transition-colors cursor-pointer active:scale-98 shrink-0 self-end sm:self-auto"
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
                    {/* Tipo de vehículo select buttons */}
                    <div className="space-y-1 col-span-2 sm:col-span-3">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                        Tipo de vehículo *
                      </label>
                      <div className="flex gap-4 max-w-md">
                        <button
                          type="button"
                          onClick={() => setVehicleType("Automóvil")}
                          className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all select-none cursor-pointer ${vehicleType === "Automóvil"
                            ? "border-[#C9A84C] bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs animate-[scaleIn_0.15s_ease-out]"
                            : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-105 hover:text-zinc-700"
                            }`}
                        >
                          Automóvil
                        </button>
                        <button
                          type="button"
                          onClick={() => setVehicleType("Motocicleta")}
                          className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all select-none cursor-pointer ${vehicleType === "Motocicleta"
                            ? "border-[#C9A84C] bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs animate-[scaleIn_0.15s_ease-out]"
                            : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-105 hover:text-zinc-700"
                            }`}
                        >
                          Motocicleta
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Placa (Sin espacios)
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
                        Año
                      </label>
                      <input type="hidden" name="year" value={year} required />
                      <div className="relative" ref={yearDropdownRef}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsYearDropdownOpen(!isYearDropdownOpen);
                            setStepError(null);
                          }}
                          className={`w-full h-11 px-3 bg-zinc-50 border rounded-lg text-sm text-zinc-855 transition-all flex items-center justify-between cursor-pointer ${isYearDropdownOpen
                            ? "border-[#C9A84C] bg-white ring-1 ring-[#C9A84C]/50"
                            : "border-zinc-200 hover:border-zinc-300"
                            }`}
                        >
                          <span className="truncate">
                            {year || "Seleccionar..."}
                          </span>
                          <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-205 ${isYearDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isYearDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-zinc-800 z-40 animate-[fadeIn_0.15s_ease-out] min-w-[140px]">
                            <div
                              onClick={() => {
                                setYear("");
                                setIsYearDropdownOpen(false);
                              }}
                              className="py-2.5 px-3 hover:bg-zinc-50 font-semibold cursor-pointer transition-colors select-none text-zinc-400"
                            >
                              Seleccionar...
                            </div>
                            {yearsList.map((y) => (
                              <div
                                key={y}
                                onClick={() => {
                                  setYear(y.toString());
                                  setIsYearDropdownOpen(false);
                                }}
                                className={`py-2.5 px-3 hover:bg-zinc-50 font-semibold cursor-pointer transition-colors select-none ${year === y.toString()
                                  ? "text-[#9A7A28] bg-[#FBF5E6]/40"
                                  : "text-zinc-700"
                                  }`}
                              >
                                {y}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Styled Brand Selector Dropdown */}
                    <div className="space-y-1 col-span-2 sm:col-span-1 relative" ref={brandDropdownRef}>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Marca
                      </label>
                      <input type="hidden" name="brandId" value={brandId} required />
                      <button
                        type="button"
                        onClick={() => {
                          setIsBrandDropdownOpen(!isBrandDropdownOpen);
                          setStepError(null);
                        }}
                        className={`w-full h-11 px-3 bg-zinc-50 border rounded-lg text-sm text-zinc-855 transition-all flex items-center justify-between cursor-pointer active:scale-99 ${isBrandDropdownOpen
                          ? "border-[#C9A84C] bg-white ring-1 ring-[#C9A84C]/50"
                          : "border-zinc-200 hover:border-zinc-300"
                          }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {brandId ? (
                            (() => {
                              const b = brands.find((b) => b.id.toString() === brandId);
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
                            <span>Seleccionar...</span>
                          )}
                        </div>
                        <ChevronDown className={`h-4 w-4 text-zinc-400 shrink-0 transition-transform duration-205 ${isBrandDropdownOpen ? "rotate-180" : ""}`} />
                      </button>

                      {isBrandDropdownOpen && (
                        <>
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg text-sm text-[#0A0A0C] z-40 animate-[fadeIn_0.15s_ease-out]">
                            {brands.map((brand) => (
                              <div
                                key={brand.id}
                                onClick={() => {
                                  setBrandId(brand.id.toString());
                                  setIsBrandDropdownOpen(false);
                                }}
                                className={`py-2.5 px-3 hover:bg-zinc-50 font-semibold cursor-pointer transition-colors select-none flex items-center gap-2 ${brandId === brand.id.toString()
                                  ? "text-[#9A7A28] bg-[#FBF5E6]/40"
                                  : "text-zinc-700"
                                  }`}
                              >
                                {brand.logo && (
                                  <img
                                    src={brand.logo}
                                    alt={brand.name}
                                    className="h-5 w-5 object-contain rounded shrink-0 bg-white"
                                  />
                                )}
                                <span>{brand.name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Modelo
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
                      <label className="text-[10px] font-bold uppercase text-zinc-400">
                        Color
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
                        Kilometraje
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
            </div>
          </div>
        </div>

        {/* ==================== PASO 3: SERVICIOS CONTRATADOS ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(3)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${activeStep === 3
              ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl"
              : "hover:bg-zinc-50/40 rounded-xl"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${selectedServices.length > 0
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
          <div
            className={`grid transition-all duration-300 ease-in-out ${activeStep === 3
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
          >
            <div className={activeStep === 3 ? "overflow-visible" : "overflow-hidden"}>
              <div className="p-6 space-y-6">
                {/* RECOMENDADOS / MÁS VENDIDOS */}
                {(() => {
                  const recommendedServices = services.filter((s) => s.isTopSelling);
                  const otherServices = services.filter((s) => !s.isTopSelling);
                  return (
                    <>
                      {recommendedServices.length > 0 && (
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A7A28] flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-[#C9A84C] animate-pulse" />
                            Servicios Destacados / Más Vendidos
                          </span>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {recommendedServices.map((service) => {
                              const isSelected = selectedServices.includes(service.id);
                              const Icon = getServiceIcon(service.name, service.icon);

                              return (
                                <div
                                  key={service.id}
                                  onClick={() => toggleService(service.id)}
                                  className={`border rounded-xl p-3 cursor-pointer select-none transition-all duration-200 flex flex-col justify-between h-20 min-h-[50px] relative hover:shadow-xs ${isSelected
                                    ? "border-[#C9A84C] bg-[#FBF5E6]/60 shadow-[0_0_0_3px_rgba(201,168,76,0.12)] text-[#9A7A28]"
                                    : "border-[#C9A84C]/35 bg-[#FBF5E6]/25 text-zinc-600 hover:border-[#C9A84C]/60 hover:bg-[#FBF5E6]/40"
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <Icon
                                      className={`h-5 w-5 ${isSelected ? "text-[#C9A84C]" : "text-[#9A7A28]/70"}`}
                                    />
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${isSelected ? "bg-[#C9A84C] border-[#C9A84C]" : "border-[#C9A84C]/30 bg-white"
                                        }`}
                                    >
                                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                  <span className={`text-xs font-bold truncate ${isSelected ? "text-[#9A7A28]" : "text-zinc-800"}`}>
                                    {service.name}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* LINEA DIVISORA */}
                      {recommendedServices.length > 0 && otherServices.length > 0 && (
                        <div className="relative py-2 select-none">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-zinc-200/80" />
                          </div>
                          <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest">
                            <span className="bg-white px-4 text-zinc-400">Otros Servicios Disponibles</span>
                          </div>
                        </div>
                      )}

                      {/* OTROS SERVICIOS */}
                      {otherServices.length > 0 && (
                        <div className="space-y-2.5">
                          {recommendedServices.length === 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              Catálogo de Servicios
                            </span>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {otherServices.map((service) => {
                              const isSelected = selectedServices.includes(service.id);
                              const Icon = getServiceIcon(service.name, service.icon);

                              return (
                                <div
                                  key={service.id}
                                  onClick={() => toggleService(service.id)}
                                  className={`border rounded-xl p-3 cursor-pointer select-none transition-all duration-200 flex flex-col justify-between h-20 min-h-[50px] relative hover:shadow-2xs ${isSelected
                                    ? "border-[#C9A84C] bg-[#FBF5E6]/60 shadow-[0_0_0_3px_rgba(201,168,76,0.12)] text-[#9A7A28]"
                                    : "border-zinc-200 bg-zinc-50/70 text-zinc-600 hover:border-zinc-350 hover:bg-zinc-100/50"
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <Icon
                                      className={`h-5 w-5 ${isSelected ? "text-[#C9A84C]" : "text-zinc-450"}`}
                                    />
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0 ${isSelected ? "bg-[#C9A84C] border-[#C9A84C]" : "border-zinc-300 bg-white"
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
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* DESCRIPCION GLOBAL DE SERVICIOS (NUEVO) */}
                {selectedServices.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-150 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                      Especificaciones o detalles de los servicios
                    </label>
                    <textarea
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder="Ej: Polarizado nano-cerámico 20% en laterales y 35% en panorámico. Luces LED altas y bajas referencia H4..."
                      rows={3}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all resize-none font-medium leading-relaxed"
                    />
                  </div>
                )}

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
                    Continuar a Checklist
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PASO 4: CHECKLIST DE RECEPCIÓN ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(4)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${activeStep === 4
              ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl"
              : "hover:bg-zinc-50/40 rounded-xl"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep === 4
                  ? "bg-[#C9A84C]/25 text-[#9A7A28]"
                  : "bg-zinc-100 text-zinc-400"
                  }`}
              >
                4
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                  Checklist de Recepción y Observaciones
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
          <div
            className={`grid transition-all duration-300 ease-in-out ${activeStep === 4
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
          >
            <div className={activeStep === 4 ? "overflow-visible" : "overflow-hidden"}>
              <div className="p-6 space-y-6">

                <div className="space-y-6">
                  {/* Exterior Group */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-1">
                      Exterior
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                      {renderChecklistItem("rayones", "Rayones")}
                      {renderChecklistItem("golpes", "Golpes")}
                      {renderChecklistItem("pintura", "Estado de pintura")}
                      {renderChecklistItem("rines", "Estado de rines")}
                      {renderChecklistItem("vidrios", "Estado de vidrios")}
                      {renderChecklistItem("parabrisas", "Estado de parabrisas")}
                      {renderChecklistItem("farolas", "Estado de farolas")}
                    </div>
                  </div>

                  {/* Interior Group */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-1">
                      Interior
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                      {renderChecklistItem("cojineria", "Estado de cojinería")}
                      {renderChecklistItem("tablero", "Estado del tablero")}
                      {renderChecklistItem("general_interior", "Estado general interior")}
                    </div>
                  </div>

                  {/* Funcionamiento Group */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 pb-1">
                      Funcionamiento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                      {renderChecklistItem("testigos", "Testigos encendidos")}
                      {renderChecklistItem("vidrios_electricos", "Vidrios eléctricos")}
                      {renderChecklistItem("luces", "Luces")}
                      {renderChecklistItem("direccionales", "Direccionales")}
                      {renderChecklistItem("reversa", "Reversa")}
                      {renderChecklistItem("estacionarias", "Estacionarias")}
                      {renderChecklistItem("pito", "Pito")}
                      {renderChecklistItem("plumillas", "Plumillas")}
                      {renderChecklistItem("espejos", "Espejos")}
                      {renderChecklistItem("lineas_termicas", "Líneas térmicas")}
                    </div>
                  </div>
                </div>

                {/* Observaciones text area */}
                <div className="pt-4 border-t border-zinc-150 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                    Observaciones generales
                  </label>
                  <ObservationsTextarea
                    value={observations}
                    onChange={setObservations}
                    placeholder="Campo libre para registrar novedades encontradas (rayones específicos, abolladuras, etc.)..."
                    rows={4}
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all resize-none font-medium leading-relaxed"
                  />
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => handlePrevStep(3)}
                    className="h-11 px-4 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNextStep(4)}
                    className="h-11 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] text-xs font-bold text-[#0A0A0C] transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    Continuar a Firma
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PASO 5: FIRMA DE RECEPCIÓN ==================== */}
        <div className="bg-white border border-zinc-200 rounded-xl shadow-xs">
          {/* Header */}
          <div
            onClick={() => handleHeaderClick(5)}
            className={`px-5 py-4 flex items-center justify-between cursor-pointer select-none transition-colors duration-150 ${activeStep === 5
              ? "bg-zinc-50/70 border-b border-zinc-100 rounded-t-xl"
              : "hover:bg-zinc-50/40 rounded-xl"
              }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep === 5 ? "bg-[#C9A84C]/25 text-[#9A7A28]" : "bg-zinc-100 text-zinc-400"
                  }`}
              >
                {signatureData ? "✓" : "5"}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-800 leading-tight">
                  Firma de Recepción
                </h3>
              </div>
            </div>
            {activeStep === 5 ? (
              <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
            ) : (
              <ChevronRight className="h-4.5 w-4.5 text-zinc-400" />
            )}
          </div>

          {/* Expanded panel */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${activeStep === 5
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
          >
            <div className={activeStep === 5 ? "overflow-visible" : "overflow-hidden"}>
              <div className="p-6 space-y-6">

                {/* Firma del Cliente Canvas */}
                <div className="pt-5 border-t border-zinc-150 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-zinc-600" />
                    <span className="text-sm font-bold text-zinc-805">Firma Digital del Cliente (Opcional)</span>
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

                {/* Aceptación de Políticas de Tratamiento de Datos */}
                <div className="pt-4 border-t border-zinc-150 space-y-2 max-w-lg">
                  {!acceptTerms && (
                    <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1.5 animate-[fadeIn_0.15s_ease-out]">
                      primero debes aceptar los terminos y condiciones
                    </p>
                  )}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        if (e.target.checked) {
                          setStepError(null);
                        }
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-[#C9A84C] focus:ring-[#C9A84C] cursor-pointer"
                    />
                    <span className="text-xs text-zinc-700 font-medium">
                      Acepto las{" "}
                      <a
                        href="/politicas-privacidad-terminos-y-condiciones"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9A7A28] font-bold underline hover:text-[#C9A84C] transition-colors"
                      >
                        políticas de tratamiento de datos
                      </a>
                    </span>
                  </label>
                </div>

                {/* Navigation and Final Submit */}
                <div className="flex justify-between pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handlePrevStep(4)}
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
            </div>
          </div>
        </div>
      </div>
      {/* DELETE CONFIRMATION MODAL */}
      {imageToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 space-y-4 animate-[scaleIn_0.2s_ease-out]">
            <h3 className="text-sm font-extrabold text-zinc-900">
              ¿Eliminar imagen?
            </h3>
            <p className="text-xs text-zinc-550 font-medium">
              ¿Estás seguro de que deseas eliminar esta fotografía de evidencia? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImageToDelete(null);
                  setArmedImage(null);
                }}
                className="h-10 px-4 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-650 transition-colors select-none cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const { key, index } = imageToDelete;
                  setChecklistImages((prev) => {
                    const currentImgs = prev[key] || [];
                    const updatedImgs = currentImgs.filter((_, i) => i !== index);
                    return {
                      ...prev,
                      [key]: updatedImgs,
                    };
                  });
                  setImageToDelete(null);
                  setArmedImage(null);
                }}
                className="h-10 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all duration-150 shadow-sm select-none cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY MODAL FOR MORE THAN 4 IMAGES */}
      {activeGalleryKey && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative p-6 space-y-4 animate-[scaleIn_0.2s_ease-out]">
            {/* Close Button with red background and hover effect */}
            <button
              type="button"
              onClick={() => setActiveGalleryKey(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm select-none"
              title="Cerrar"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div>
              <span className="font-mono font-bold text-xs text-[#9A7A28] uppercase tracking-wider block">
                Galería de evidencias
              </span>
              <h3 className="text-base font-extrabold text-zinc-900 mt-0.5 capitalize">
                {activeGalleryKey.replace(/_/g, " ")}
              </h3>
            </div>

            {/* Modal Body: Images Grid */}
            <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-60 p-1">
              {(checklistImages[activeGalleryKey] || []).map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const isTouch = typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches;
                    if (!isTouch) {
                      setImageToDelete({ key: activeGalleryKey, index: idx });
                    } else {
                      if (armedImage?.key === activeGalleryKey && armedImage?.index === idx) {
                        setImageToDelete({ key: activeGalleryKey, index: idx });
                      } else {
                        setArmedImage({ key: activeGalleryKey, index: idx });
                      }
                    }
                  }}
                  className="aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 relative group cursor-pointer shrink-0"
                  title="Clic en PC, dos toques en móvil para eliminar"
                >
                  <img src={imgUrl} className="w-full h-full object-cover" />
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${(armedImage?.key === activeGalleryKey && armedImage?.index === idx)
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                    }`}>
                    <Trash2 className="h-5 w-5 text-white" />
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer: Subir imágenes button */}
            <div className="pt-2 border-t border-zinc-100">
              <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-zinc-100 hover:bg-emerald-500 hover:text-white border border-zinc-200 hover:border-emerald-500 text-zinc-700 text-xs font-bold transition-all duration-200 cursor-pointer select-none">
                <UploadCloud className="h-4.5 w-4.5" />
                Subir imágenes
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(activeGalleryKey, e.target.files)}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
