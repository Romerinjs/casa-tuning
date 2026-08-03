"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Search, CalendarClock, User, Car, Wrench, Check, AlertCircle, Clock } from "lucide-react";
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

  // Date & Time state (Separate date and time to enforce business hours and Colombia timezone)
  const todayColombia = getTodayColombiaStr();
  const [scheduledDate, setScheduledDate] = useState(todayColombia);
  const [scheduledTime, setScheduledTime] = useState("09:00");

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
    } else {
      // Default: Tomorrow or Today at 09:00 AM
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
      setErrorMsg("El celular debe contener exactamente 10 dígitos.");
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      setErrorMsg("Debes seleccionar fecha y hora válida para la cita.");
      return;
    }

    if (scheduledDate < todayColombia) {
      setErrorMsg("No se pueden agendar citas en fechas anteriores a hoy.");
      return;
    }

    if (isSundaySelected) {
      setErrorMsg("Casa Tuning no atiende los domingos. Elige un día entre Lunes y Sábado.");
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrorMsg("Selecciona al menos un servicio para agendar.");
      return;
    }

    // Submit with explicit America/Bogota (-05:00) ISO string to avoid 5-hour shift bug
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
                Horario de atención: Lun-Vie 8:30 a.m. - 6:30 p.m. | Sáb 8:00 a.m. - 6:30 p.m.
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

          {/* SECTION 3: FECHA Y HORA DE LA CITA CON RESTRICCIÓN DE HORARIO Y DÍAS PASADOS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-zinc-150 pb-2">
              <CalendarClock className="h-4 w-4 text-[#9A7A28]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-900">
                Fecha y Hora de la Cita <span className="text-red-500">*</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Fecha de Agendamiento
                </label>
                <input
                  type="date"
                  required
                  min={todayColombia}
                  value={scheduledDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setScheduledDate(newDate);
                    // Adjust default time if Sunday
                    const isSun = new Date(`${newDate}T12:00:00-05:00`).getDay() === 0;
                    if (!isSun && timeSlots.length > 0 && !timeSlots.some(s => s.value === scheduledTime)) {
                      setScheduledTime(timeSlots[0].value);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:border-[#C9A84C] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-700 block mb-1">
                  Hora de Atencion (Horario Empresa)
                </label>
                {isSundaySelected ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-800 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Cerrado los domingos</span>
                  </div>
                ) : (
                  <select
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:border-[#C9A84C] focus:bg-white focus:outline-none"
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

            <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-500 flex items-center justify-between">
              <span><strong>Horarios permitidos:</strong> Lun-Vie: 8:30 AM - 6:30 PM | Sáb: 8:00 AM - 6:30 PM</span>
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
              disabled={isPending || isSundaySelected}
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
