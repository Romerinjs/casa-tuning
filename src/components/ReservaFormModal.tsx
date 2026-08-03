"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Search, CalendarClock, User, Car, Wrench, Check, Plus, AlertCircle } from "lucide-react";
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
    brand: { id: number; name: string };
  }[];
}

interface BrandOption {
  id: number;
  name: string;
}

interface ServiceOption {
  id: number;
  name: string;
}

interface ReservaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOption[];
  brands: BrandOption[];
  services: ServiceOption[];
  initialData?: any | null;
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

  // Date & Time
  const [scheduledAt, setScheduledAt] = useState("");

  // Services
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  // Notes
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData) {
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
        const isoStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setScheduledAt(isoStr);
      }

      if (initialData.services && Array.isArray(initialData.services)) {
        setSelectedServiceIds(initialData.services.map((s: any) => s.serviceId));
      }
      setNotes(initialData.notes || "");
    } else {
      // Default: Tomorrow at 09:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      const isoStr = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(isoStr);

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
  };

  if (!isOpen) return null;

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!clientName.trim() || !clientPhone.trim()) {
      setErrorMsg("El nombre y celular del cliente son requeridos.");
      return;
    }

    const cleanPhone = clientPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setErrorMsg("El número de celular debe contener exactamente 10 dígitos.");
      return;
    }

    if (!scheduledAt) {
      setErrorMsg("Debes seleccionar la fecha y hora de la cita.");
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg("Selecciona al menos un servicio para agendar.");
      return;
    }

    const formData = new FormData();
    formData.append("clientName", clientName);
    formData.append("clientPhone", cleanPhone);
    if (clientEmail) formData.append("clientEmail", clientEmail);
    formData.append("scheduledAt", scheduledAt);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="bg-white border border-zinc-200/90 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-page-entry">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#111113] text-white flex items-center justify-between border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#9A7A28] flex items-center justify-center text-[#0A0A0C]">
              <CalendarClock className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {initialData ? `Editar Reserva ${initialData.code}` : "Agendar Nueva Reserva"}
              </h3>
              <p className="text-xs text-white/50">
                Registra la cita y notifica al cliente vía WhatsApp
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: DATOS DEL CLIENTE */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <User className="h-4 w-4 text-[#9A7A28]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                Información del Cliente
              </h4>
            </div>

            {!initialData && (
              <div className="relative">
                <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por teléfono o nombre..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
                {filteredClients.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-zinc-100">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#FBF5E6]/60 transition-colors flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-zinc-900">{c.name}</p>
                          <p className="text-[11px] text-zinc-500">{c.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#9A7A28] bg-[#FBF5E6] px-2 py-0.5 rounded-md">
                          Seleccionar
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Celular WhatsApp (10 dígitos) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="3001234567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DATOS DEL VEHÍCULO */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-2">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-[#9A7A28]" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                  Información del Vehículo
                </h4>
              </div>
            </div>

            {selectedClient && selectedClient.cars && selectedClient.cars.length > 0 && (
              <div className="bg-[#FBF5E6]/50 p-3 rounded-xl border border-[#C9A84C]/20">
                <label className="text-[10px] font-extrabold text-[#9A7A28] uppercase block mb-1.5">
                  Vehículos Registrados del Cliente
                </label>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        selectedCarId === car.id
                          ? "bg-[#9A7A28] text-white border-[#9A7A28]"
                          : "bg-white text-zinc-700 border-zinc-200 hover:border-[#C9A84C]"
                      }`}
                    >
                      {car.brand.name} {car.model} ({car.plate})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Placa
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="ABC123"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 font-mono font-bold uppercase focus:border-[#C9A84C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Marca
                </label>
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#C9A84C] focus:outline-none"
                >
                  <option value="">-- Seleccionar Marca --</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Modelo / Línea
                </label>
                <input
                  type="text"
                  placeholder="Ej. Corolla / CX-5"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#C9A84C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: FECHA Y HORA DE LA CITA */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <CalendarClock className="h-4 w-4 text-[#9A7A28]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                Fecha y Hora Agendada <span className="text-red-500">*</span>
              </h4>
            </div>

            <div>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:border-[#C9A84C] focus:bg-white focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* SECTION 4: SERVICIOS CONTRATADOS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <Wrench className="h-4 w-4 text-[#9A7A28]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                Servicios Solicitados <span className="text-red-500">*</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {services.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FBF5E6] text-[#9A7A28] border-[#C9A84C]"
                        : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <span>{s.name}</span>
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border ${
                        isSelected
                          ? "bg-[#9A7A28] text-white border-[#9A7A28]"
                          : "border-zinc-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: NOTAS */}
          <div className="space-y-2 pt-2">
            <label className="text-[11px] font-bold text-zinc-700 block">
              Observaciones / Notas Adicionales
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre la cita o solicitudes especiales del cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:border-[#C9A84C] focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-150 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-xl bg-[#C9A84C] hover:bg-[#b0903c] text-xs font-bold text-[#0A0A0C] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
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
        </form>
      </div>
    </div>
  );
}
