"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { getPresignedUploadUrlAction, getWhatsAppTemplatesAction, createPromotionAction } from "@/app/(authenticated)/promociones/actions";
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
  ChevronDown,
  Clock,
  Sparkles,
  Search,
  ListFilter,
  Check,
  Video,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  ArrowRight,
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
  fileUrl: string | null;
  createdAt: Date;
  service: {
    name: string;
  };
  brand: {
    name: string;
    logo: string | null;
  };
  clients: {
    clientId: number;
    status: string; // SENT or FAILED or PENDING
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

  // Nueva Campaña Form States
  const [campaignName, setCampaignName] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  
  // WhatsApp Templates States
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  // Direct Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Clients checklist
  const [checkedClients, setCheckedClients] = useState<Record<number, boolean>>({});
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const [isPending, startCreateTransition] = useTransition();

  // Load templates on mount / when opening Nueva Campaña
  useEffect(() => {
    async function loadTemplates() {
      setIsLoadingTemplates(true);
      setTemplatesError(null);
      try {
        const res = await getWhatsAppTemplatesAction();
        if (res.success && res.templates) {
          setTemplates(res.templates);
        } else {
          setTemplatesError(res.error || "No se pudieron obtener las plantillas.");
        }
      } catch (err) {
        setTemplatesError("Error al consultar las plantillas.");
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  // Selected template object helper
  const selectedTemplateObj = useMemo(() => {
    return templates.find((t) => t.name === selectedTemplateName);
  }, [templates, selectedTemplateName]);

  // Check if current template requires header media (IMAGE, VIDEO, DOCUMENT)
  const headerMediaFormat = useMemo(() => {
    if (!selectedTemplateObj) return null;
    const header = selectedTemplateObj.components?.find((c: any) => c.type === "HEADER");
    if (header && ["IMAGE", "VIDEO", "DOCUMENT"].includes(header.format)) {
      return header.format as "IMAGE" | "VIDEO" | "DOCUMENT";
    }
    return null;
  }, [selectedTemplateObj]);

  // Clients that qualify for the campaign (have active car matching selected brand)
  const qualifiedClients = useMemo(() => {
    if (!selectedBrandId) return [];
    const brandIdNum = parseInt(selectedBrandId, 10);
    return clients.filter((c) =>
      c.cars.some((car) => car.brandId === brandIdNum)
    );
  }, [clients, selectedBrandId]);

  // Auto check/uncheck qualified clients when brand changes
  useEffect(() => {
    const nextChecked: Record<number, boolean> = {};
    qualifiedClients.forEach((c) => {
      nextChecked[c.id] = true;
    });
    setCheckedClients(nextChecked);
    setUploadedFileUrl(null);
    setSelectedFile(null);
  }, [qualifiedClients]);

  // Filter qualified clients by text search
  const filteredClients = useMemo(() => {
    return qualifiedClients.filter(
      (c) =>
        c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
        c.phone.includes(clientSearchTerm)
    );
  }, [qualifiedClients, clientSearchTerm]);

  // Select all / deselect all helpers
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

  // Direct upload to R2
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Strict validation
    if (headerMediaFormat === "IMAGE" && !file.type.startsWith("image/")) {
      setUploadError("Por favor, suba una imagen válida (JPG, PNG, WEBP).");
      return;
    }
    if (headerMediaFormat === "VIDEO" && !file.type.startsWith("video/")) {
      setUploadError("Por favor, suba un video válido (MP4).");
      return;
    }
    if (headerMediaFormat === "DOCUMENT" && file.type !== "application/pdf") {
      setUploadError("Por favor, suba un documento PDF válido.");
      return;
    }

    // Size limit 50MB (50 * 1024 * 1024 bytes)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError("El tamaño del archivo supera el límite permitido de 50MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFile(file);

    try {
      const res = await getPresignedUploadUrlAction(file.name, file.type);
      if (!res.success || !res.uploadUrl || !res.fileUrl) {
        setUploadError(res.error || "No se pudo generar la URL firmada.");
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
          showToast("Archivo subido con éxito.", "success");
        } else {
          setUploadError("Error al cargar el archivo directamente en storage.");
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
      setUploadError("Ocurrió un error inesperado al iniciar la subida.");
      setIsUploading(false);
    }
  };

  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      showToast("Ingrese el nombre de la campaña.", "warning");
      return;
    }
    if (!selectedServiceId) {
      showToast("Seleccione el servicio asociado.", "warning");
      return;
    }
    if (!selectedBrandId) {
      showToast("Seleccione la marca objetivo.", "warning");
      return;
    }
    if (!selectedTemplateName) {
      showToast("Seleccione una plantilla de WhatsApp.", "warning");
      return;
    }
    if (headerMediaFormat && !uploadedFileUrl) {
      showToast("Esta plantilla requiere que suba el archivo de cabecera.", "warning");
      return;
    }

    const selectedIds = Object.entries(checkedClients)
      .filter(([_, checked]) => checked)
      .map(([id]) => parseInt(id, 10));

    if (selectedIds.length === 0) {
      showToast("Debe seleccionar al menos un cliente destinatario.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("name", campaignName.trim());
    formData.append("serviceId", selectedServiceId);
    formData.append("brandId", selectedBrandId);
    formData.append("templateName", selectedTemplateName);
    if (uploadedFileUrl) {
      formData.append("fileUrl", uploadedFileUrl);
    }
    formData.append("clientIds", JSON.stringify(selectedIds));

    startCreateTransition(async () => {
      const res = await createPromotionAction(null, formData);
      if (res.success) {
        showToast("Campaña de mercadeo creada e iniciada con éxito.", "success");
        // Reset Form
        setCampaignName("");
        setSelectedServiceId("");
        setSelectedBrandId("");
        setSelectedTemplateName("");
        setUploadedFileUrl(null);
        setSelectedFile(null);
        setCheckedClients({});
        setActiveTab("historial");
      } else {
        showToast(res.error || "Ocurrió un error al crear la campaña.", "error");
      }
    });
  };

  // Helper icons for media formats
  const getMediaIcon = (format: string | null) => {
    if (!format) return null;
    switch (format) {
      case "VIDEO":
        return <Video className="h-5 w-5 text-indigo-500" />;
      case "IMAGE":
        return <ImageIcon className="h-5 w-5 text-emerald-500" />;
      case "DOCUMENT":
        return <FileText className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Megaphone className="h-5.5 w-5.5 text-[#C9A84C]" />
          Promociones y WhatsApp Marketing
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
          <form onSubmit={handleCampaignSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start max-w-6xl mx-auto">
            {/* LEFT 2 COLUMNS: CONFIG AND UPLOADER */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign configuration card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Sparkles className="h-4.5 w-4.5 text-[#C9A84C]" />
                  Configurar Campaña
                </h3>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Promo Polarizados Toyota Junio"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                      <option value="">Seleccionar...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      <option value="">Seleccionar...</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Templates Selector */}
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Plantilla WhatsApp Aprobada *
                  </label>
                  {isLoadingTemplates ? (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                      <div className="h-4 w-4 animate-spin rounded-full border border-[#9A7A28] border-t-transparent" />
                      Cargando plantillas de Kapso...
                    </div>
                  ) : templatesError ? (
                    <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {templatesError}
                    </div>
                  ) : (
                    <select
                      value={selectedTemplateName}
                      onChange={(e) => {
                        setSelectedTemplateName(e.target.value);
                        setUploadedFileUrl(null);
                        setSelectedFile(null);
                        setUploadError(null);
                      }}
                      required
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-850 focus:border-[#C9A84C] focus:bg-white focus:outline-none cursor-pointer"
                    >
                      <option value="">Seleccionar plantilla aprobada...</option>
                      {templates.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} ({t.language})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Render template body preview */}
                  {selectedTemplateObj && (
                    <div className="bg-[#FBF5E6]/40 border border-[#C9A84C]/25 rounded-xl p-4 mt-3 space-y-2 text-xs">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#9A7A28] block">
                        Vista previa del texto
                      </span>
                      <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                        {selectedTemplateObj.components?.find((c: any) => c.type === "BODY")?.text}
                      </p>
                      <p className="text-[10px] text-zinc-400 italic">
                        Nota: Las variables se mapean automáticamente (1 = Cliente, 2 = Servicio, 3 = Marca).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Uploader Card */}
              {headerMediaFormat && (
                <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
                    {getMediaIcon(headerMediaFormat)}
                    Subir Archivo de Cabecera ({headerMediaFormat})
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Esta plantilla requiere una cabecera de tipo <strong>{headerMediaFormat}</strong>. Sube el archivo correspondiente (máximo 50MB).
                  </p>

                  {isUploading ? (
                    <div className="border border-zinc-200/80 rounded-xl p-5 bg-zinc-50/50 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-650">
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                          Subiendo {selectedFile?.name}...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C9A84C] to-[#9A7A28] transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : uploadedFileUrl ? (
                    <div className="bg-zinc-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-3 animate-[scaleIn_0.15s_ease-out]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 border border-green-100 flex items-center justify-center shrink-0">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-850 truncate">{selectedFile?.name}</p>
                          <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">Archivo cargado en storage</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileUrl(null);
                          setSelectedFile(null);
                        }}
                        className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-zinc-450 hover:text-red-500 hover:bg-red-50 border border-transparent transition-all cursor-pointer"
                        title="Eliminar archivo"
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
                        if (headerMediaFormat === "IMAGE") input.accept = "image/*";
                        if (headerMediaFormat === "VIDEO") input.accept = "video/mp4";
                        if (headerMediaFormat === "DOCUMENT") input.accept = "application/pdf";
                        input.onchange = (ev) => {
                          const file = (ev.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file);
                        };
                        input.click();
                      }}
                      className="border-2 border-dashed border-zinc-200 hover:border-[#C9A84C]/50 hover:bg-[#FBF5E6]/10 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group select-none animate-[fadeIn_0.15s_ease-out]"
                    >
                      <div className="h-10 w-10 rounded-lg bg-zinc-50 group-hover:bg-[#FBF5E6]/40 flex items-center justify-center border border-zinc-150 group-hover:border-[#C9A84C]/25 text-zinc-400 group-hover:text-[#9A7A28] transition-colors shadow-2xs">
                        <UploadCloud className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-zinc-750">Seleccionar o Arrastrar Archivo</p>
                        <p className="text-[10px] text-zinc-400">
                          Soporta {headerMediaFormat === "IMAGE" ? "JPG, PNG, WEBP" : headerMediaFormat === "VIDEO" ? "MP4" : "PDF"} (Máx. 50MB)
                        </p>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-650 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                      <XCircle className="h-4 w-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CLIENTS TARGET LIST */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col max-h-[85vh]">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3 shrink-0">
                <Users className="h-4.5 w-4.5 text-[#C9A84C]" />
                Clientes Destinatarios ({qualifiedClients.length})
              </h3>

              {!selectedBrandId ? (
                <div className="p-6 text-center text-xs text-zinc-400 italic">
                  Seleccione una marca objetivo para cargar los clientes destinatarios correspondientes.
                </div>
              ) : qualifiedClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-400 italic">
                  No hay clientes registrados que posean vehículos de esta marca.
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden pt-3 space-y-4">
                  {/* Select Toggles */}
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider shrink-0 select-none">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-[#9A7A28] hover:text-[#C9A84C] transition-colors cursor-pointer"
                    >
                      Seleccionar Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                    >
                      Deseleccionar Todos
                    </button>
                  </div>

                  {/* Search box inside client targeting */}
                  <div className="relative shrink-0">
                    <Search className="absolute inset-y-0 left-2.5 my-auto h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar destinatario..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                    {filteredClients.map((client) => {
                      const isChecked = !!checkedClients[client.id];
                      return (
                        <div
                          key={client.id}
                          onClick={() => {
                            setCheckedClients((prev) => ({
                              ...prev,
                              [client.id]: !prev[client.id],
                            }));
                          }}
                          className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? "border-[#C9A84C] bg-[#FBF5E6]/30"
                              : "border-zinc-200 hover:bg-zinc-50/50"
                          }`}
                        >
                          <div
                            className={`h-4.5 w-4.5 rounded border flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                              isChecked
                                ? "bg-[#C9A84C] border-[#C9A84C] text-[#0A0A0C]"
                                : "border-zinc-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-800 leading-tight">{client.name}</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">{client.phone}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {client.cars
                                .filter((car) => car.brandId === parseInt(selectedBrandId, 10))
                                .map((car) => (
                                  <span
                                    key={car.id}
                                    className="text-[8px] bg-zinc-150 border border-zinc-250 font-mono font-bold text-zinc-700 px-1 rounded"
                                  >
                                    {car.plate}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary dispatch send button */}
                  <div className="pt-3 border-t border-zinc-100 shrink-0">
                    <button
                      type="submit"
                      disabled={isPending || isUploading}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-98"
                    >
                      {isPending ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                          <span>Despachando...</span>
                        </>
                      ) : (
                        <>
                          <span>Disparar Campaña</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        ) : (
          /* HISTORIAL DE CAMPAÑAS */
          <div className="max-w-5xl mx-auto space-y-4">
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock className="h-4.5 w-4.5 text-[#C9A84C]" />
              Campañas de Mercadeo Enviadas
            </h3>

            {promotions.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
                No hay registros de campañas en el historial.
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-450 font-bold uppercase tracking-wider select-none">
                        <th className="py-3 px-4 font-bold">Campaña / Fecha</th>
                        <th className="py-3 px-4 font-bold">Plantilla / Media</th>
                        <th className="py-3 px-4 font-bold">Servicio / Marca</th>
                        <th className="py-3 px-4 font-bold text-center">Destinatarios</th>
                        <th className="py-3 px-4 font-bold text-center">Estado del Envío</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 text-zinc-700">
                      {promotions.map((p) => {
                        const total = p.clients.length;
                        const sent = p.clients.filter((c) => c.status === "SENT").length;
                        const failed = p.clients.filter((c) => c.status === "FAILED").length;
                        const pending = p.clients.filter((c) => c.status === "PENDING").length;

                        return (
                          <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-zinc-900 leading-tight block">{p.name}</span>
                              <span className="text-[10px] text-zinc-400 mt-1 block">
                                {new Date(p.createdAt).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}{" "}
                                {new Date(p.createdAt).toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium">
                              <code className="text-[10px] bg-zinc-100 border border-zinc-200 text-zinc-650 px-1 rounded">
                                {p.templateName}
                              </code>
                              {p.fileUrl ? (
                                <a
                                  href={p.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-[#9A7A28] hover:underline font-bold mt-1 block flex items-center gap-1"
                                >
                                  Ver Media Adjunto
                                </a>
                              ) : (
                                <span className="text-[9px] text-zinc-400 block mt-1">Sin archivo adjunto</span>
                              )}
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
                                  <span className="font-semibold block truncate max-w-[120px]">{p.service.name}</span>
                                  <span className="text-[10px] text-zinc-400 block">{p.brand.name}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-zinc-800">
                              {total}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2 text-[10px] font-bold">
                                  <span className="text-green-600 font-semibold bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                                    {sent} ✓
                                  </span>
                                  {failed > 0 && (
                                    <span className="text-red-600 font-semibold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                      {failed} ✕
                                    </span>
                                  )}
                                  {pending > 0 && (
                                    <span className="text-zinc-500 font-semibold bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 rounded">
                                      {pending} ...
                                    </span>
                                  )}
                                </div>
                                <div className="w-24 h-1.5 bg-zinc-100 border border-zinc-200 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="h-full bg-green-500 transition-all duration-150"
                                    style={{ width: `${(sent / total) * 100}%` }}
                                  />
                                </div>
                              </div>
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
