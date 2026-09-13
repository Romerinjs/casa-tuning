"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  getPresignedUploadUrlAction,
  createAndDispatchPromotionAction,
  syncBroadcastStatusAction,
} from "@/app/(authenticated)/promociones/actions";
import { useToast } from "@/components/ui/Toast";
import {
  Megaphone,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle,
  XCircle,
  Users,
  Tag,
  Wrench,
  Clock,
  Sparkles,
  Search,
  Check,
  Image as ImageIcon,
  FileText,
  ArrowRight,
  RefreshCw,
  Calendar,
  Gift,
  CheckCheck,
  Info,
} from "lucide-react";

interface BrandItem {
  id: number;
  name: string;
  logo: string | null;
}

interface ServiceItem {
  id: number;
  name: string;
}

interface ClientCar {
  id: number;
  plate: string;
  model: string;
  year: number;
  brandId: number;
}

interface ClientItem {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  cars: ClientCar[];
}

interface PromotionHistoryItem {
  id: number;
  name: string;
  templateName: string;
  whatsappTemplateId?: string | null;
  kapsoBroadcastId?: string | null;
  status?: string;
  totalRecipients?: number;
  sentCount?: number;
  failedCount?: number;
  fileUrl: string | null;
  createdAt: Date;
  dispatchedAt?: Date | null;
  service: {
    name: string;
  };
  brand: {
    name: string;
    logo: string | null;
  };
  clients: {
    clientId: number;
    status: string;
  }[];
}

interface PromocionesClientViewProps {
  brands: BrandItem[];
  services: ServiceItem[];
  clients: ClientItem[];
  promotions: PromotionHistoryItem[];
}

export default function PromocionesClientView({
  brands,
  services,
  clients,
  promotions,
}: PromocionesClientViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"nueva" | "historial">("nueva");

  // Form Fields
  const [campaignName, setCampaignName] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");

  // Dynamic Template Variables
  const [benefitDescription, setBenefitDescription] = useState("");
  const [validityDate, setValidityDate] = useState("");

  // Cloudflare R2 Direct Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Clients checklist
  const [checkedClients, setCheckedClients] = useState<Record<number, boolean>>({});
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  // Dispatch transition
  const [isPending, startCreateTransition] = useTransition();

  // Syncing state per promotion in history
  const [syncingId, setSyncingId] = useState<number | null>(null);

  // Selected Brand Object
  const selectedBrandObj = useMemo(() => {
    if (!selectedBrandId) return null;
    return brands.find((b) => b.id === parseInt(selectedBrandId, 10)) || null;
  }, [brands, selectedBrandId]);

  // Selected Service Object
  const selectedServiceObj = useMemo(() => {
    if (!selectedServiceId) return null;
    return services.find((s) => s.id === parseInt(selectedServiceId, 10)) || null;
  }, [services, selectedServiceId]);

  // Clients with active cars matching selected brand
  const qualifiedClients = useMemo(() => {
    if (!selectedBrandId) return [];
    const brandIdNum = parseInt(selectedBrandId, 10);
    return clients.filter((c) =>
      c.cars.some((car) => car.brandId === brandIdNum)
    );
  }, [clients, selectedBrandId]);

  // Auto check all qualified clients when brand changes
  useEffect(() => {
    const nextChecked: Record<number, boolean> = {};
    qualifiedClients.forEach((c) => {
      nextChecked[c.id] = true;
    });
    setCheckedClients(nextChecked);
  }, [qualifiedClients]);

  // Filter qualified clients by text search
  const filteredClients = useMemo(() => {
    const term = clientSearchTerm.trim().toLowerCase();
    if (!term) return qualifiedClients;
    return qualifiedClients.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.cars.some((car) => car.plate.toLowerCase().includes(term))
    );
  }, [qualifiedClients, clientSearchTerm]);

  // Count of selected clients
  const selectedClientsCount = useMemo(() => {
    return Object.values(checkedClients).filter(Boolean).length;
  }, [checkedClients]);

  // Select all / deselect all
  const handleSelectAll = () => {
    const nextChecked: Record<number, boolean> = {};
    qualifiedClients.forEach((c) => {
      nextChecked[c.id] = true;
    });
    setCheckedClients(nextChecked);
  };

  const handleDeselectAll = () => {
    setCheckedClients({});
  };

  // Direct upload to Cloudflare R2 via presigned URL
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Por favor, suba una imagen válida (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("El tamaño de la imagen no debe superar los 20MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFileName(file.name);

    try {
      const res = await getPresignedUploadUrlAction(file.name, file.type);
      if (!res.success || !res.uploadUrl || !res.fileUrl) {
        setUploadError(res.error || "No se pudo generar la URL firmada de subida.");
        setIsUploading(false);
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open("PUT", res.uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setUploadedFileUrl(res.fileUrl);
          showToast("Banner subido exitosamente a Cloudflare R2.", "success");
        } else {
          setUploadError("Error al cargar la imagen en el almacenamiento R2.");
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setUploadError("Error de red durante la subida.");
        setIsUploading(false);
      };

      xhr.send(file);
    } catch (err) {
      console.error(err);
      setUploadError("Ocurrió un error inesperado al iniciar la carga.");
      setIsUploading(false);
    }
  };

  // Handle Form Submit
  const handleLaunchCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      showToast("Ingrese el nombre de la campaña.", "warning");
      return;
    }
    if (!selectedBrandId) {
      showToast("Seleccione la marca de vehículo objetivo.", "warning");
      return;
    }
    if (!selectedServiceId) {
      showToast("Seleccione el servicio promocionado.", "warning");
      return;
    }
    if (!benefitDescription.trim()) {
      showToast("Ingrese la descripción del beneficio o descuento.", "warning");
      return;
    }
    if (!validityDate.trim()) {
      showToast("Ingrese la fecha de vigencia de la oferta.", "warning");
      return;
    }

    const selectedIds = Object.entries(checkedClients)
      .filter(([_, checked]) => checked)
      .map(([id]) => parseInt(id, 10));

    if (selectedIds.length === 0) {
      showToast("Debe seleccionar al menos un cliente destinatario.", "warning");
      return;
    }

    startCreateTransition(async () => {
      const res = await createAndDispatchPromotionAction({
        promotionName: campaignName.trim(),
        brandId: parseInt(selectedBrandId, 10),
        serviceId: parseInt(selectedServiceId, 10),
        clientIds: selectedIds,
        variables: {
          benefitDescription: benefitDescription.trim(),
          validityDate: validityDate.trim(),
        },
        fileUrl: uploadedFileUrl,
      });

      if (res.success) {
        showToast(
          `¡Campaña encolada con éxito en Kapso Broadcasts (${res.added} destinatarios)!`,
          "success"
        );
        // Reset form
        setCampaignName("");
        setSelectedBrandId("");
        setSelectedServiceId("");
        setBenefitDescription("");
        setValidityDate("");
        setUploadedFileUrl(null);
        setSelectedFileName(null);
        setCheckedClients({});
        setActiveTab("historial");
      } else {
        showToast(res.error || "Ocurrió un error al lanzar la campaña.", "error");
      }
    });
  };

  // Sync individual broadcast status
  const handleSyncStatus = async (promotionId: number) => {
    setSyncingId(promotionId);
    try {
      const res = await syncBroadcastStatusAction(promotionId);
      if (res.success) {
        showToast(
          `Estado sincronizado: ${res.status} (${res.sentCount} enviados, ${res.failedCount} fallidos)`,
          "success"
        );
      } else {
        showToast(res.error || "No se pudo sincronizar el estado.", "error");
      }
    } catch {
      showToast("Error de conexión al sincronizar.", "error");
    } finally {
      setSyncingId(null);
    }
  };

  // Sample client name for mock preview
  const sampleClientName = useMemo(() => {
    const firstSelected = qualifiedClients.find((c) => checkedClients[c.id]);
    return firstSelected ? firstSelected.name.split(" ")[0] : "Juan";
  }, [qualifiedClients, checkedClients]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Megaphone className="h-5.5 w-5.5 text-[#C9A84C]" />
          Campañas y WhatsApp Marketing
        </h2>
      </header>

      {/* TABS ROW */}
      <div className="bg-white border-b border-zinc-200 px-8 shrink-0 flex gap-6 select-none overflow-x-auto max-w-full no-scrollbar">
        <button
          onClick={() => setActiveTab("nueva")}
          className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "nueva"
              ? "border-[#C9A84C] text-[#9A7A28]"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <Plus className="h-4 w-4" />
          Nueva Campaña
        </button>
        <button
          onClick={() => setActiveTab("historial")}
          className={`py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "historial"
              ? "border-[#C9A84C] text-[#9A7A28]"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          }`}
        >
          <Clock className="h-4 w-4" />
          Historial de Campañas
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === "nueva" ? (
          <form
            onSubmit={handleLaunchCampaign}
            className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-7xl mx-auto"
          >
            {/* COLUMNA IZQUIERDA (CONFIGURACIÓN Y VARIABLES): 7 COLS */}
            <div className="xl:col-span-7 space-y-6">
              {/* Tarjeta 1: Datos Base de Campaña */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <h3 className="text-sm font-bold text-zinc-850 flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-[#C9A84C]" />
                    Configuración de Campaña
                  </h3>
                  {/* Indicador reactivo de plantilla */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                      uploadedFileUrl
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {uploadedFileUrl ? (
                      <>
                        <ImageIcon className="h-3 w-3" />
                        <span>Plantilla: Con Banner Multimedia</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3" />
                        <span>Plantilla: Solo Texto</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Nombre de campaña */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Promo Polarizados Mazda Octubre"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>

                {/* Selectores Marca y Servicio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Marca de Carro Objetivo *
                    </label>
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Seleccionar marca objetivo...</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Wrench className="h-3 w-3" />
                      Servicio Promocionado *
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Variables Dinámicas */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-zinc-850 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Gift className="h-4.5 w-4.5 text-[#C9A84C]" />
                  Variables Dinámicas de la Promoción
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Beneficio o Descuento */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      Beneficio o Descuento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 20% de descuento en PPF frontal"
                      value={benefitDescription}
                      onChange={(e) => setBenefitDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>

                  {/* Fecha de Vigencia */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Fecha de Vigencia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 31 de Octubre de 2026"
                      value={validityDate}
                      onChange={(e) => setValidityDate(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Uploader Directo a Cloudflare R2 */}
                <div className="pt-2 border-t border-zinc-100 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Banner Multimedia (Opcional - Cloudflare R2)
                    </span>
                    <span className="text-[9px] text-zinc-400 lowercase font-normal">
                      (Si subes imagen se activa automáticamente la plantilla con header multimedia)
                    </span>
                  </label>

                  {isUploading ? (
                    <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-650">
                        <span className="flex items-center gap-2">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                          Subiendo {selectedFileName}...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C9A84C] to-[#9A7A28] transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : uploadedFileUrl ? (
                    <div className="bg-zinc-50 border border-green-200 rounded-xl p-3 flex items-center justify-between gap-3 animate-[fadeIn_0.15s_ease-out]">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={uploadedFileUrl}
                          alt="Banner preview"
                          className="h-12 w-12 rounded-lg object-cover border border-zinc-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-850 truncate">{selectedFileName || "banner.jpg"}</p>
                          <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">
                            Cargado en Cloudflare R2
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileUrl(null);
                          setSelectedFileName(null);
                        }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        title="Eliminar imagen y volver a modo Solo Texto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (ev) => {
                          const file = (ev.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file);
                        };
                        input.click();
                      }}
                      className="border-2 border-dashed border-zinc-200 hover:border-[#C9A84C]/60 hover:bg-[#FBF5E6]/10 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group select-none"
                    >
                      <div className="h-9 w-9 rounded-lg bg-zinc-50 group-hover:bg-[#FBF5E6]/40 flex items-center justify-center border border-zinc-150 group-hover:border-[#C9A84C]/30 text-zinc-400 group-hover:text-[#9A7A28] transition-colors">
                        <UploadCloud className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-xs font-bold text-zinc-750">Seleccionar o Arrastrar Banner Promocional</p>
                      <p className="text-[10px] text-zinc-400">JPG, PNG o WEBP (Máximo 20MB)</p>
                    </div>
                  )}

                  {uploadError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-center text-xs font-semibold text-red-650 flex items-center justify-center gap-1.5">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta 3: Segmentación y Checklist Interactivo */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col max-h-[480px]">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3 shrink-0">
                  <h3 className="text-sm font-bold text-zinc-850 flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-[#C9A84C]" />
                    Destinatarios objetivo:{" "}
                    {selectedBrandObj ? (
                      <span className="text-[#9A7A28]">
                        {qualifiedClients.length} clientes con {selectedBrandObj.name}
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-normal">Seleccione una marca</span>
                    )}
                  </h3>
                  {qualifiedClients.length > 0 && (
                    <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {selectedClientsCount} seleccionados
                    </span>
                  )}
                </div>

                {!selectedBrandId ? (
                  <div className="p-8 text-center text-xs text-zinc-400 italic">
                    Seleccione una Marca de Carro Objetivo en el formulario superior para cargar la lista segmentada.
                  </div>
                ) : qualifiedClients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-400 italic">
                    No se encontraron clientes registrados con vehículos activos de marca{" "}
                    <strong>{selectedBrandObj?.name}</strong>.
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden pt-3 space-y-3">
                    {/* Botones de selección masiva */}
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider shrink-0 select-none">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[#9A7A28] hover:text-[#C9A84C] transition-colors cursor-pointer"
                      >
                        Seleccionar Todos ({qualifiedClients.length})
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
                      >
                        Deseleccionar Todos
                      </button>
                    </div>

                    {/* Buscador de destinatarios */}
                    <div className="relative shrink-0">
                      <Search className="absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre, celular o placa..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#C9A84C]"
                      />
                    </div>

                    {/* Lista Scrolleable */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                      {filteredClients.map((client) => {
                        const isChecked = !!checkedClients[client.id];
                        const matchingCars = client.cars.filter(
                          (c) => c.brandId === parseInt(selectedBrandId, 10)
                        );

                        return (
                          <div
                            key={client.id}
                            onClick={() => {
                              setCheckedClients((prev) => ({
                                ...prev,
                                [client.id]: !prev[client.id],
                              }));
                            }}
                            className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isChecked
                                ? "border-[#C9A84C]/80 bg-[#FBF5E6]/35"
                                : "border-zinc-200/80 hover:bg-zinc-50/70"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  isChecked
                                    ? "bg-[#C9A84C] border-[#C9A84C] text-[#0A0A0C]"
                                    : "border-zinc-300 bg-white"
                                }`}
                              >
                                {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-850 truncate">{client.name}</p>
                                <p className="text-[10px] text-zinc-400">{client.phone}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 shrink-0">
                              {matchingCars.map((car) => (
                                <span
                                  key={car.id}
                                  className="text-[9px] bg-zinc-100 border border-zinc-200 font-mono font-bold text-zinc-700 px-1.5 py-0.5 rounded"
                                >
                                  {car.plate}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA (PREVISUALIZACIÓN WHATSAPP + BOTÓN DE ACCIÓN): 5 COLS */}
            <div className="xl:col-span-5 space-y-6 xl:sticky xl:top-6">
              {/* WhatsApp Mock Mobile Container */}
              <div className="bg-[#EFEAE2] border border-zinc-300 rounded-2xl overflow-hidden shadow-md flex flex-col">
                {/* WhatsApp Chat Header */}
                <div className="bg-[#075E54] px-4 py-3 text-white flex items-center gap-3 shrink-0">
                  <div className="h-9 w-9 rounded-full bg-[#128C7E] border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                    CT
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">Casa Tuning Colombia</p>
                    <p className="text-[10px] text-emerald-100/90 leading-none mt-0.5">en línea</p>
                  </div>
                </div>

                {/* WhatsApp Chat Body Area */}
                <div className="p-4 space-y-3 min-h-[360px] flex flex-col justify-end bg-[radial-gradient(#dcd4c8_1px,transparent_1px)] [background-size:16px_16px]">
                  <div className="self-center bg-[#E1F3FB] text-[#4A4A4A] text-[9px] font-semibold px-2.5 py-1 rounded-md shadow-2xs">
                    HOY
                  </div>

                  {/* Message Bubble */}
                  <div className="max-w-[92%] bg-white rounded-lg rounded-tl-xs p-2.5 shadow-sm space-y-2 border border-black/5">
                    {/* Header Image if present */}
                    {uploadedFileUrl ? (
                      <div className="rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 max-h-48">
                        <img
                          src={uploadedFileUrl}
                          alt="Banner WhatsApp Header"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    ) : null}

                    {/* Text Body with Live Interpolation */}
                    <div className="text-xs text-zinc-800 leading-relaxed space-y-2 whitespace-pre-wrap">
                      <p>
                        ¡Hola <strong>{sampleClientName}</strong>! En Casa Tuning tenemos una promoción especial para tu{" "}
                        <strong>{selectedBrandObj ? selectedBrandObj.name : "vehículo"}</strong>:{" "}
                        <span className="font-semibold text-zinc-900">
                          {benefitDescription.trim() || "[Descripción del beneficio o descuento]"}
                        </span>
                        . Oferta válida hasta el{" "}
                        <span className="font-semibold text-zinc-900">
                          {validityDate.trim() || "[Fecha de vigencia]"}
                        </span>
                        . ¡Escríbenos para agendar tu cita y transformar tu vehículo!
                      </p>
                      <p className="text-[10px] text-zinc-500 italic">
                        Servicio: {selectedServiceObj ? selectedServiceObj.name : "Personalización y Cuidado Automotriz"}.
                      </p>
                    </div>

                    {/* Time and Double Check */}
                    <div className="flex items-center justify-end gap-1 text-[9px] text-zinc-400 pt-0.5 select-none">
                      <span>10:45 a. m.</span>
                      <CheckCheck className="h-3.5 w-3.5 text-[#34B7F1]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón de Lanzamiento Dinámico */}
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
                <button
                  type="submit"
                  disabled={
                    isPending ||
                    isUploading ||
                    selectedClientsCount === 0 ||
                    !campaignName.trim() ||
                    !selectedBrandId ||
                    !selectedServiceId ||
                    !benefitDescription.trim() ||
                    !validityDate.trim()
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A84C] hover:bg-[#9A7A28] px-5 py-3 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-98"
                >
                  {isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                      <span>Encolando en Kapso Broadcasts...</span>
                    </>
                  ) : (
                    <>
                      <span>Lanzar Campaña ({selectedClientsCount} clientes seleccionados)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 justify-center">
                  <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Kapso gestionará el pacing y entrega contra Meta WhatsApp API.</span>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* HISTORIAL DE CAMPAÑAS */
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-[#C9A84C]" />
                Historial de Campañas de Mercadeo
              </h3>
              <span className="text-xs text-zinc-400 font-medium">
                Total registradas: {promotions.length}
              </span>
            </div>

            {promotions.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400">
                No hay registros de campañas en el historial.
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-450 font-bold uppercase tracking-wider select-none">
                        <th className="py-3 px-4 font-bold">Campaña / Fecha</th>
                        <th className="py-3 px-4 font-bold">Servicio / Marca</th>
                        <th className="py-3 px-4 font-bold">Plantilla / Media</th>
                        <th className="py-3 px-4 font-bold text-center">Destinatarios</th>
                        <th className="py-3 px-4 font-bold text-center">Estado Broadcast</th>
                        <th className="py-3 px-4 font-bold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 text-zinc-700">
                      {promotions.map((p) => {
                        const total = p.totalRecipients || p.clients.length;
                        const status = (p.status || "DISPATCHING").toUpperCase();

                        let statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {status}
                          </span>
                        );

                        if (status === "SENDING") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 justify-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                              SENDING
                            </span>
                          );
                        } else if (status === "COMPLETED") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                              COMPLETED
                            </span>
                          );
                        } else if (status === "FAILED") {
                          statusBadge = (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              FAILED
                            </span>
                          );
                        }

                        return (
                          <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-zinc-900 leading-tight block">{p.name}</span>
                              <span className="text-[10px] text-zinc-400 mt-1 block">
                                {new Date(p.createdAt).toLocaleDateString("es-CO", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                {new Date(p.createdAt).toLocaleTimeString("es-CO", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {p.brand.logo && (
                                  <img
                                    src={p.brand.logo}
                                    alt={p.brand.name}
                                    className="h-5 w-5 object-contain bg-white rounded border border-zinc-150 p-0.5"
                                  />
                                )}
                                <div className="min-w-0">
                                  <span className="font-semibold block truncate max-w-[130px]">{p.service.name}</span>
                                  <span className="text-[10px] text-zinc-400 block">{p.brand.name}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-medium">
                              <code className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-650 px-1.5 py-0.5 rounded">
                                {p.templateName}
                              </code>
                              {p.fileUrl ? (
                                <a
                                  href={p.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-[#9A7A28] hover:underline font-bold mt-1 block flex items-center gap-1"
                                >
                                  <ImageIcon className="h-2.5 w-2.5" />
                                  Ver Banner R2
                                </a>
                              ) : (
                                <span className="text-[9px] text-zinc-400 block mt-1">Solo Texto</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="font-bold text-zinc-850 block">{total}</span>
                              <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-400 mt-0.5">
                                <span className="text-green-600 font-semibold">{p.sentCount ?? 0} env.</span>
                                <span>•</span>
                                <span className="text-red-500 font-semibold">{p.failedCount ?? 0} fall.</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">{statusBadge}</td>

                            <td className="py-3.5 px-4 text-right">
                              {p.kapsoBroadcastId && (
                                <button
                                  onClick={() => handleSyncStatus(p.id)}
                                  disabled={syncingId === p.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-md transition-all cursor-pointer disabled:opacity-50"
                                  title="Consultar progreso a Kapso Broadcasts"
                                >
                                  <RefreshCw
                                    className={`h-3 w-3 ${syncingId === p.id ? "animate-spin text-[#9A7A28]" : ""}`}
                                  />
                                  <span>{syncingId === p.id ? "Sincronizando..." : "Sincronizar"}</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
