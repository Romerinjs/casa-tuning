"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { createClientAction, updateClientAction, createCarAction, uploadClientPhotoAction } from "@/app/(authenticated)/clientes/actions";
import { downloadOrderPdfAction } from "@/app/(authenticated)/ordenes/actions";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Plus,
  X,
  Phone,
  Mail,
  Car,
  ClipboardList,
  User,
  Calendar,
  Edit,
  ChevronDown,
  Camera,
  FileText,
} from "lucide-react";

interface ClientCar {
  id: number;
  plate: string;
  model: string;
  year: number;
  brand: { name: string; logo?: string | null };
}

interface ClientOrder {
  id: number;
  code: string;
  createdAt: Date;
  status: { name: string };
  services: { service: { name: string } }[];
}

interface ClientData {
  id: number;
  name: string;
  phone: string;
  documentNumber: string | null;
  documentTypeId: number | null;
  documentType: { id: number; code: string; name: string } | null;
  email: string | null;
  photoUrl: string | null;
  createdAt: Date;
  cars: ClientCar[];
  orders: ClientOrder[];
}

interface BrandItem {
  id: number;
  name: string;
  logo?: string | null;
}

interface DocumentTypeItem {
  id: number;
  code: string;
  name: string;
}

interface ClientesClientViewProps {
  clients: ClientData[];
  brands: BrandItem[];
  documentTypes: DocumentTypeItem[];
}

export default function ClientesClientView({ clients, brands, documentTypes }: ClientesClientViewProps) {
  const { showToast } = useToast();
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Close brand dropdown when clicking/tapping outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  
  // Modals Visibility
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCarModalOpen, setIsCarModalOpen] = useState(false);

  // Create Client Form State
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientDocumentTypeId, setClientDocumentTypeId] = useState("");
  const [clientDocumentNumber, setClientDocumentNumber] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  // Edit Client Form State
  const [editClientId, setEditClientId] = useState<number | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editClientEmail, setEditClientEmail] = useState("");
  const [editClientDocumentTypeId, setEditClientDocumentTypeId] = useState("");
  const [editClientDocumentNumber, setEditClientDocumentNumber] = useState("");
  const [editClientError, setEditClientError] = useState<string | null>(null);

  // Add Car Form State
  const [carClientId, setCarClientId] = useState<number | null>(null);
  const [carPlate, setCarPlate] = useState("");
  const [carYear, setCarYear] = useState("");
  const [carBrandId, setCarBrandId] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carError, setCarError] = useState<string | null>(null);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

  // Server Actions Transitions
  const [isPending, startCreateTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();
  const [isCarPending, startCarTransition] = useTransition();

  // Years select range: currentYear + 1 down to 1990
  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 38 }, (_, i) => currentYear + 1 - i);

  // Sync selected client details if list updates (e.g. after adding a client/order)
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated && updated !== selectedClient) {
        const timer = setTimeout(() => {
          setSelectedClient(updated);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [clients, selectedClient]);

  // Reset form inputs and errors when opening create modal
  const openCreateModal = () => {
    setClientName("");
    setClientPhone("");
    setClientEmail("");
    setClientDocumentTypeId("");
    setClientDocumentNumber("");
    setClientError(null);
    setIsCreateModalOpen(true);
  };

  // Reset form inputs and errors when opening edit modal
  const openEditModal = (client: ClientData) => {
    setEditClientId(client.id);
    setEditClientName(client.name);
    setEditClientPhone(client.phone);
    setEditClientEmail(client.email || "");
    setEditClientDocumentTypeId(client.documentTypeId ? client.documentTypeId.toString() : "");
    setEditClientDocumentNumber(client.documentNumber || "");
    setEditClientError(null);
    setIsEditModalOpen(true);
  };

  // Reset form inputs and errors when opening add car modal
  const openAddCarModal = (clientId: number) => {
    setCarClientId(clientId);
    setCarPlate("");
    setCarYear("");
    setCarBrandId("");
    setCarModel("");
    setCarColor("");
    setCarError(null);
    setIsBrandDropdownOpen(false);
    setIsCarModalOpen(true);
  };

  // Input Sanitizations
  const handlePhoneChange = (val: string, setter: (v: string) => void, errorSetter: (e: string | null) => void) => {
    setter(val.replace(/\D/g, "").slice(0, 10));
    errorSetter(null);
  };

  const handlePlateChange = (val: string) => {
    setCarPlate(val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6));
    setCarError(null);
  };

  const handleDownloadPdf = async (orderId: number) => {
    setDownloadingPdfId(orderId);
    try {
      const res = await downloadOrderPdfAction(orderId);
      if (res.success && res.url) {
        window.open(res.url, "_blank");
        showToast("Ficha técnica descargada con éxito.", "success");
      } else {
        showToast(res.error || "Error al descargar la ficha técnica.", "error");
      }
    } catch (err: any) {
      showToast("Ocurrió un error inesperado al descargar la ficha técnica.", "error");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusStyles = (statusName: string) => {
    switch (statusName) {
      case "RECIBIDO":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "EN_PROCESO":
        return "bg-orange-50 text-orange-700 border-orange-200/60";
      case "LISTO":
        return "bg-green-50 text-green-700 border-green-200/60";
      case "ENTREGADO":
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">
          Clientes
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 px-4 py-2 text-xs font-bold text-[#0A0A0C] transition-all duration-150 shadow-[0_2px_8px_rgba(201,168,76,0.25)] cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Nuevo Cliente
        </button>
      </header>

      {/* SEARCH AND GRID CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Search bar container */}
        <div className="relative max-w-md">
          <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, celular o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:outline-none transition-colors"
          />
        </div>

        {/* Clients list grid */}
        {filteredClients.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
            No se encontraron clientes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-white border border-zinc-200 hover:border-[#C9A84C] rounded-xl p-5 shadow-xs transition-all duration-150 cursor-pointer hover:shadow-md flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {client.photoUrl ? (
                        <img
                          src={client.photoUrl}
                          alt={client.name}
                          className="h-7 w-7 rounded-lg object-cover border border-zinc-200/60 shrink-0 shadow-2xs"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-zinc-50 flex items-center justify-center text-[#9A7A28] border border-zinc-200 shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <h3 className="font-bold text-zinc-900 group-hover:text-[#9A7A28] transition-colors truncate">
                        {client.name}
                      </h3>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Car className="h-3.5 w-3.5" />
                    <span>
                      {client.cars.length}{" "}
                      {client.cars.length === 1 ? "vehículo" : "vehículos"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span>{client.orders.length} servicios</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BACKGROUND BLUR OVERLAY FOR DRAWER & MODAL */}
      {(selectedClient || isCreateModalOpen || isEditModalOpen || isCarModalOpen) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-45 transition-opacity duration-300"
          onClick={() => {
            setSelectedClient(null);
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setIsCarModalOpen(false);
          }}
        />
      )}

      {/* DETAILS SLIDING DRAWER FROM RIGHT */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl p-6 flex flex-col transform transition-transform duration-300 ease-out ${
          selectedClient ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedClient && (
          <>
            {/* Drawer Header */}
            <div className="flex flex-col items-center text-center gap-3 border-b border-zinc-200 pb-5 mb-6 relative">
              <button
                onClick={() => setSelectedClient(null)}
                className="absolute top-0 right-0 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-150 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="relative group/avatar cursor-pointer mt-2">
                {isUploadingPhoto ? (
                  <div className="h-20 w-20 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#9A7A28] border-t-transparent" />
                  </div>
                ) : selectedClient.photoUrl ? (
                  <img
                    src={selectedClient.photoUrl}
                    alt={selectedClient.name}
                    className="h-20 w-20 rounded-2xl object-cover border border-zinc-250 shadow-sm"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-zinc-100 flex items-center justify-center text-[#9A7A28] border border-zinc-200 shadow-sm">
                    <User className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/45 rounded-2xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-150">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploadingPhoto}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    if (!file.type.startsWith("image/")) {
                      showToast("Por favor, selecciona un archivo de imagen válido", "error");
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      const base64Data = event.target?.result as string;
                      setIsUploadingPhoto(true);
                      try {
                        const res = await uploadClientPhotoAction(selectedClient.id, base64Data);
                        if (res.success && res.photoUrl) {
                          showToast("Foto de perfil actualizada con éxito", "success");
                          setSelectedClient(prev => prev ? { ...prev, photoUrl: res.photoUrl || null } : null);
                        } else {
                          showToast(res.error || "Error al subir la foto", "error");
                        }
                      } catch (err) {
                        console.error("Error updating photo:", err);
                        showToast("Error al subir la foto", "error");
                      } finally {
                        setIsUploadingPhoto(false);
                        e.target.value = "";
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              
              <div>
                <h3 className="font-bold text-zinc-900 leading-tight text-lg">
                  {selectedClient.name}
                </h3>
              </div>

              <button
                onClick={() => openEditModal(selectedClient)}
                className="h-8 px-4 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-[#9A7A28] hover:border-[#C9A84C]/50 transition-all flex items-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar Perfil
              </button>
            </div>

            {/* Drawer Body Scroll */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {/* Contact Info Card */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-zinc-700">
                  <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                  <a
                    href={`tel:${selectedClient.phone}`}
                    className="hover:underline hover:text-[#9A7A28] font-medium"
                  >
                    {selectedClient.phone}
                  </a>
                </div>
                {selectedClient.email && (
                  <div className="flex items-center gap-2.5 text-sm text-zinc-700">
                    <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="hover:underline hover:text-[#9A7A28] break-all"
                    >
                      {selectedClient.email}
                    </a>
                  </div>
                )}
                {selectedClient.documentNumber ? (
                  <div className="flex items-center gap-2.5 text-sm text-zinc-700 pt-2 border-t border-zinc-200/60">
                    <User className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span className="font-semibold text-zinc-800">
                      {selectedClient.documentType ? `${selectedClient.documentType.code}: ` : "Doc: "}
                      {selectedClient.documentNumber}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-sm text-zinc-700 pt-2 border-t border-zinc-200/60">
                    <User className="h-4 w-4 text-zinc-400 shrink-0" />
                    <button
                      onClick={() => openEditModal(selectedClient)}
                      className="text-xs font-semibold text-[#9A7A28] hover:text-[#C9A84C] transition-colors underline bg-transparent border-0 p-0 cursor-pointer align-baseline"
                    >
                      Añadir número de documento
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-xs text-zinc-400 pt-1 border-t border-zinc-200/60">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Registrado el{" "}
                    {new Date(selectedClient.createdAt).toLocaleDateString(
                      "es-ES",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </span>
                </div>
              </div>

              {/* Registered Vehicles */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5" />
                    Vehículos ({selectedClient.cars.length})
                  </h4>
                  <button
                    onClick={() => openAddCarModal(selectedClient.id)}
                    className="text-xs font-bold text-[#9A7A28] hover:text-[#7C601C] flex items-center gap-1.5 bg-[#FBF5E6] border border-[#C9A84C]/40 px-3 py-1.5 rounded-lg active:scale-98 transition-all cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar Vehículo
                  </button>
                </div>
                
                {selectedClient.cars.length === 0 ? (
                  <p className="text-sm text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-4 text-center">
                    No hay vehículos registrados.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedClient.cars.map((car) => (
                      <div
                        key={car.id}
                        className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center gap-3"
                      >
                        {car.brand.logo ? (
                          <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-150 p-1 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={car.brand.logo} alt={car.brand.name} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-[#FBF5E6] text-[#9A7A28] border border-[#C9A84C]/25 flex items-center justify-center text-xs font-bold shrink-0 select-none">
                            {car.brand.name.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-mono font-bold text-xs bg-zinc-100 border border-zinc-300 rounded px-2 py-0.5 tracking-wider text-zinc-800 shrink-0">
                          {car.plate}
                        </span>
                        <div className="min-w-0">
                          <h5 className="font-semibold text-zinc-800 text-sm truncate">
                            {car.brand.name} {car.model}
                          </h5>
                          <p className="text-[10px] text-zinc-400">
                            Año {car.year}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Historial de Órdenes ({selectedClient.orders.length})
                </h4>
                {selectedClient.orders.length === 0 ? (
                  <p className="text-sm text-zinc-400 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl p-4 text-center">
                    Sin órdenes operativas registradas.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-[#9A7A28]">
                            {order.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusStyles(
                              order.status.name
                            )}`}
                          >
                            {order.status.name}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {order.services.map((item, index) => (
                            <span
                              key={index}
                              className="text-[10px] bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-600"
                            >
                              {item.service.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100 mt-1">
                          <span className="text-[9px] text-zinc-400">
                            Recibido:{" "}
                            {new Date(order.createdAt).toLocaleDateString(
                              "es-ES"
                            )}{" "}
                            {new Date(order.createdAt).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(order.id)}
                            disabled={downloadingPdfId === order.id}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9A7A28] hover:text-[#7C601C] disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {downloadingPdfId === order.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border border-[#9A7A28] border-t-transparent" />
                            ) : (
                              <FileText className="h-3 w-3" />
                            )}
                            Ficha Técnica
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CENTERED CREATE CLIENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both]">
          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <h3 className="font-bold text-zinc-950 text-sm">Nuevo Cliente</h3>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/55 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Modal Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!clientName.trim()) {
                setClientError("El nombre completo del cliente es obligatorio.");
                return;
              }
              if (clientPhone.length !== 10) {
                setClientError("El celular del cliente debe contener exactamente 10 números.");
                return;
              }
              if (clientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
                setClientError("El correo electrónico ingresado no tiene un formato válido.");
                return;
              }
              if ((clientDocumentNumber.trim() && !clientDocumentTypeId) || (!clientDocumentNumber.trim() && clientDocumentTypeId)) {
                setClientError("Si ingresa información de documento, debe seleccionar el tipo y el número de documento.");
                return;
              }
              setClientError(null);
              const formData = new FormData(e.currentTarget);
              startCreateTransition(async () => {
                const res = await createClientAction(null, formData);
                if (res.success) {
                  showToast("Cliente creado con éxito", "success");
                  setIsCreateModalOpen(false);
                  setClientName("");
                  setClientPhone("");
                  setClientEmail("");
                  setClientDocumentTypeId("");
                  setClientDocumentNumber("");
                  setClientError(null);
                } else if (res.error) {
                  setClientError(res.error);
                  showToast(res.error, "error");
                }
              });
            }}
            className="p-5 space-y-4"
          >
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="name"
                required
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  setClientError(null);
                }}
                placeholder="Ej. Carlos Andrés Restrepo"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Tipo Doc.
                </label>
                <select
                  name="documentTypeId"
                  value={clientDocumentTypeId}
                  onChange={(e) => {
                    setClientDocumentTypeId(e.target.value);
                    setClientError(null);
                  }}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Sel...</option>
                  {documentTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Número de Documento
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  value={clientDocumentNumber}
                  autoComplete="off"
                  onChange={(e) => {
                    setClientDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setClientError(null);
                  }}
                  placeholder="Ej. 1045238910"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Celular / Teléfono (10 dígitos) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={clientPhone}
                onChange={(e) => handlePhoneChange(e.target.value, setClientPhone, setClientError)}
                placeholder="Ej. 3148821234"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Correo Electrónico (Opcional)
              </label>
              <input
                type="email"
                name="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  setClientError(null);
                }}
                placeholder="carlos@correo.com"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {clientError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
                {clientError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:scale-98 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 transition-all rounded-lg text-xs font-bold text-[#0A0A0C] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                {isPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                ) : (
                  "Guardar Cliente"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CENTERED EDIT CLIENT MODAL */}
      {isEditModalOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both]">
          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <h3 className="font-bold text-zinc-950 text-sm">Editar Cliente</h3>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/55 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Modal Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editClientName.trim()) {
                setEditClientError("El nombre completo del cliente es obligatorio.");
                return;
              }
              if (editClientPhone.length !== 10) {
                setEditClientError("El celular del cliente debe contener exactamente 10 números.");
                return;
              }
              if (editClientEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editClientEmail.trim())) {
                setEditClientError("El correo electrónico ingresado no tiene un formato válido.");
                return;
              }
              if ((editClientDocumentNumber.trim() && !editClientDocumentTypeId) || (!editClientDocumentNumber.trim() && editClientDocumentTypeId)) {
                setEditClientError("Si ingresa información de documento, debe seleccionar el tipo y el número de documento.");
                return;
              }
              setEditClientError(null);
              const formData = new FormData(e.currentTarget);
              startEditTransition(async () => {
                const res = await updateClientAction(null, formData);
                if (res.success) {
                  showToast("Cliente actualizado con éxito", "success");
                  setIsEditModalOpen(false);
                  setEditClientError(null);
                } else if (res.error) {
                  setEditClientError(res.error);
                  showToast(res.error, "error");
                }
              });
            }}
            className="p-5 space-y-4"
          >
            <input type="hidden" name="id" value={editClientId || ""} />

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="name"
                required
                value={editClientName}
                onChange={(e) => {
                  setEditClientName(e.target.value);
                  setEditClientError(null);
                }}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Tipo Doc.
                </label>
                <select
                  name="documentTypeId"
                  value={editClientDocumentTypeId}
                  onChange={(e) => {
                    setEditClientDocumentTypeId(e.target.value);
                    setEditClientError(null);
                  }}
                  className="w-full px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Sel...</option>
                  {documentTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Número de Documento
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  value={editClientDocumentNumber}
                  autoComplete="off"
                  onChange={(e) => {
                    setEditClientDocumentNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setEditClientError(null);
                  }}
                  placeholder="Ej. 1045238910"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Celular / Teléfono (10 dígitos) *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={editClientPhone}
                onChange={(e) => handlePhoneChange(e.target.value, setEditClientPhone, setEditClientError)}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={editClientEmail}
                onChange={(e) => {
                  setEditClientEmail(e.target.value);
                  setEditClientError(null);
                }}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {editClientError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
                {editClientError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:scale-98 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isEditPending}
                className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 transition-all rounded-lg text-xs font-bold text-[#0A0A0C] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                {isEditPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CENTERED ADD CAR MODAL */}
      {isCarModalOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both]">
          {/* Modal Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <h3 className="font-bold text-zinc-955 text-sm">Registrar Vehículo</h3>
            <button
              onClick={() => setIsCarModalOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/55 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Modal Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (carPlate.length < 5 || carPlate.length > 6) {
                setCarError("La placa del vehículo debe contener entre 5 y 6 caracteres alfanuméricos.");
                return;
              }
              if (!carYear) {
                setCarError("El año del vehículo es obligatorio.");
                return;
              }
              if (!carBrandId) {
                setCarError("La marca es obligatoria.");
                return;
              }
              if (!carModel.trim()) {
                setCarError("El modelo es obligatorio.");
                return;
              }
              if (!carColor.trim()) {
                setCarError("El color es obligatorio.");
                return;
              }
              setCarError(null);
              const formData = new FormData(e.currentTarget);
              startCarTransition(async () => {
                const res = await createCarAction(null, formData);
                if (res.success) {
                  showToast("Vehículo registrado con éxito", "success");
                  setIsCarModalOpen(false);
                  setCarPlate("");
                  setCarYear("");
                  setCarBrandId("");
                  setCarModel("");
                  setCarColor("");
                  setCarError(null);
                } else if (res.error) {
                  setCarError(res.error);
                  showToast(res.error, "error");
                }
              });
            }}
            className="p-5 space-y-4"
          >
            <input type="hidden" name="clientId" value={carClientId || ""} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Placa (Máx. 6) *
                </label>
                <input
                  type="text"
                  name="plate"
                  required
                  value={carPlate}
                  onChange={(e) => handlePlateChange(e.target.value)}
                  placeholder="AAA000"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm font-mono font-bold uppercase tracking-wider text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Año *
                </label>
                <select
                  name="year"
                  required
                  value={carYear}
                  onChange={(e) => {
                    setCarYear(e.target.value);
                    setCarError(null);
                  }}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">Seleccionar año...</option>
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Brand native select overlay */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Marca *
              </label>
              <button
                type="button"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer"
                onClickCapture={() => {
                  const selector = document.getElementById("addCarBrandSelect");
                  if (selector) (selector as any).showPicker?.() || selector.focus();
                }}
              >
                <span className="truncate">
                  {carBrandId
                    ? brands.find((b) => b.id.toString() === carBrandId)?.name || "Seleccionar..."
                    : "Seleccionar..."}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
              </button>
              <select
                id="addCarBrandSelect"
                name="brandId"
                value={carBrandId}
                required
                onChange={(e) => {
                  setCarBrandId(e.target.value);
                  setCarError(null);
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              >
                <option value="">Seleccionar...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Modelo *
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  value={carModel}
                  onChange={(e) => {
                    setCarModel(e.target.value);
                    setCarError(null);
                  }}
                  placeholder="Ej. Picanto"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
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
                  value={carColor}
                  onChange={(e) => {
                    setCarColor(e.target.value);
                    setCarError(null);
                  }}
                  placeholder="Ej. Blanco"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-850 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {carError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
                {carError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsCarModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:scale-98 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCarPending}
                className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 transition-all rounded-lg text-xs font-bold text-[#0A0A0C] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md"
              >
                {isCarPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                ) : (
                  "Registrar Vehículo"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
