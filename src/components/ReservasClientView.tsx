"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  ArrowRight,
  Edit,
  Trash2,
  User,
  Phone,
  Car,
  Wrench,
  Calendar,
  Send,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import ReservaFormModal from "./ReservaFormModal";
import { sendManualReminderAction, cancelReservationAction } from "@/app/(authenticated)/reservas/actions";

interface ReservationData {
  id: number;
  code: string;
  scheduledAt: Date;
  status: string;
  notes: string | null;
  reminderSent: boolean;
  reminderSentAt: Date | null;
  createdAt: Date;
  clientId: number;
  client: {
    name: string;
    phone: string;
    email: string | null;
  };
  carId: number | null;
  car: {
    plate: string;
    model: string;
    brand: { name: string };
  } | null;
  vehiclePlate: string | null;
  vehicleModel: string | null;
  brand: { id: number; name: string } | null;
  services: {
    serviceId: number;
    service: { name: string };
  }[];
}

interface ReservasClientViewProps {
  reservations: ReservationData[];
  clients: any[];
  brands: any[];
  services: any[];
}

export default function ReservasClientView({
  reservations,
  clients,
  brands,
  services,
}: ReservasClientViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODAS");
  const [dateFilter, setDateFilter] = useState("PROXIMAS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationData | null>(null);
  const [deletingReservation, setDeletingReservation] = useState<ReservationData | null>(null);
  const [actionPendingId, setActionPendingId] = useState<number | null>(null);
  const [isDeletingPending, setIsDeletingPending] = useState(false);
  const [, startTransition] = useTransition();

  // KPIs
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const citasHoyCount = reservations.filter((r) => {
    const dStr = new Date(r.scheduledAt).toISOString().slice(0, 10);
    return dStr === todayStr && r.status !== "CANCELADA";
  }).length;

  const citasProximasCount = reservations.filter((r) => {
    return new Date(r.scheduledAt) >= now && r.status === "PENDIENTE";
  }).length;

  const citasAtendidasCount = reservations.filter((r) => r.status === "ATENDIDA").length;
  const citasCanceladasCount = reservations.filter((r) => r.status === "CANCELADA").length;

  // Filter Logic
  const filteredReservations = reservations.filter((res) => {
    // Search
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      res.code.toLowerCase().includes(searchLower) ||
      res.client.name.toLowerCase().includes(searchLower) ||
      res.client.phone.includes(searchTerm) ||
      (res.car?.plate && res.car.plate.toLowerCase().includes(searchLower)) ||
      (res.vehiclePlate && res.vehiclePlate.toLowerCase().includes(searchLower));

    // Status Filter
    const matchesStatus = statusFilter === "TODAS" || res.status === statusFilter;

    // Date Filter
    let matchesDate = true;
    const resDate = new Date(res.scheduledAt);
    const resDateStr = resDate.toISOString().slice(0, 10);

    if (dateFilter === "HOY") {
      matchesDate = resDateStr === todayStr;
    } else if (dateFilter === "PROXIMAS") {
      matchesDate = resDate >= new Date(now.setHours(0, 0, 0, 0)) && res.status !== "CANCELADA";
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort: Upcoming dates first
  const sortedReservations = [...filteredReservations].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const handleSendReminder = (resId: number) => {
    setActionPendingId(resId);
    startTransition(async () => {
      try {
        const res = await sendManualReminderAction(resId);
        if (res.success) {
          showToast("Recordatorio enviado con éxito por WhatsApp.", "success");
        } else {
          showToast(res.error || "No se pudo enviar el recordatorio.", "error");
        }
      } catch (err) {
        showToast("Error de conexión al enviar el recordatorio.", "error");
      } finally {
        setActionPendingId(null);
      }
    });
  };

  const handleConfirmCancelReservation = () => {
    if (!deletingReservation) return;
    setIsDeletingPending(true);
    startTransition(async () => {
      try {
        const res = await cancelReservationAction(deletingReservation.id);
        if (res.success) {
          showToast(`Reserva ${deletingReservation.code} cancelada.`, "warning");
          setDeletingReservation(null);
        } else {
          showToast(res.error || "Error al cancelar reserva.", "error");
        }
      } catch (err) {
        showToast("Error de conexión al cancelar la reserva.", "error");
      } finally {
        setIsDeletingPending(false);
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        );
      case "ATENDIDA":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Atendida
          </span>
        );
      case "CANCELADA":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
            <XCircle className="h-3 w-3" />
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F7F7F8]">
      {/* Top Header */}
      <header className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-6 w-6 text-[#9A7A28]" />
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
            Módulo de Reservas
          </h2>
        </div>

        <button
          onClick={() => {
            setEditingReservation(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#C9A84C] hover:bg-[#b0903c] text-xs sm:text-sm font-bold text-[#0A0A0C] transition-all cursor-pointer shadow-xs select-none"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Nueva Reserva</span>
          <span className="sm:hidden">Agendar</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-page-entry">
        {/* KPI CARDS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Citas para Hoy
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1">
                {citasHoyCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-[#9A7A28] border border-amber-200/60 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Próximas Citas
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1">
                {citasProximasCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Atendidas
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1">
                {citasAtendidasCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-zinc-400">
                Canceladas
              </p>
              <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-1">
                {citasCanceladasCount}
              </h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-zinc-100 text-zinc-500 border border-zinc-200 flex items-center justify-center shrink-0">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between bg-zinc-50/50 p-3 sm:p-4 rounded-xl border border-zinc-200/60 shadow-xs">
          {/* Text Search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar cliente, celular, placa o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 focus:outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date filter tabs */}
            <div className="flex bg-zinc-200/60 rounded-lg p-0.5 text-xs select-none">
              {[
                { key: "PROXIMAS", label: "Próximas" },
                { key: "HOY", label: "Hoy" },
                { key: "TODAS", label: "Todas" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDateFilter(f.key)}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    dateFilter === f.key
                      ? "bg-white text-zinc-900 shadow-2xs"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 focus:border-[#C9A84C] focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todos los Estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="ATENDIDA">Atendidas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>

        {/* RESERVATIONS LIST */}
        {sortedReservations.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 sm:p-12 text-center text-zinc-400 shadow-xs">
            <CalendarClock className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="font-bold text-sm text-zinc-700">No se encontraron reservas.</p>
            <p className="text-xs text-zinc-400 mt-1">
              Prueba cambiando los filtros o registra una nueva reserva.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
            {sortedReservations.map((res) => {
              const isPendingAction = actionPendingId === res.id;
              const dateObj = new Date(res.scheduledAt);
              const formattedDate = dateObj.toLocaleDateString("es-CO", {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "America/Bogota",
              });
              const formattedTime = dateObj.toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "America/Bogota",
              });

              // Vehicle resolution
              const vehicleStr = res.car
                ? `${res.car.brand.name} ${res.car.model}`
                : res.brand && res.vehicleModel
                ? `${res.brand.name} ${res.vehicleModel}`
                : res.vehicleModel || "Vehículo sin especificar";

              const plateStr = res.car?.plate || res.vehiclePlate || "SIN PLACA";

              return (
                <div
                  key={res.id}
                  className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {isPendingAction && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-10 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                    </div>
                  )}

                  {/* Header info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div>
                        <span className="font-mono font-bold text-[10px] text-[#9A7A28] bg-[#FBF5E6]/90 px-2 py-0.5 rounded border border-[#C9A84C]/25">
                          {res.code}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 mt-2">
                          <Calendar className="h-3.5 w-3.5 text-[#9A7A28]" />
                          <span>{formattedDate}</span>
                          <span className="text-zinc-400">·</span>
                          <span>{formattedTime}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {getStatusBadge(res.status)}
                        {res.reminderSent ? (
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <Send className="h-3 w-3" /> Recordatorio enviado
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">Sin recordatorio</span>
                        )}
                      </div>
                    </div>

                    {/* Client & Vehicle */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-900 truncate flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            {res.client.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                            {res.client.phone}
                          </p>
                        </div>
                        <span className="font-mono font-extrabold text-[10px] bg-[#FCD34D]/25 text-[#78350F] border border-[#F59E0B]/30 rounded px-1.5 py-0.5 shrink-0">
                          {plateStr}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-700 flex items-center gap-1 font-medium">
                        <Car className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {vehicleStr}
                      </p>
                    </div>

                    {/* Services list badges */}
                    <div className="space-y-1 pt-1">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">
                        Servicios
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {res.services.map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-[#FBF5E6]/80 text-[#9A7A28] border border-[#C9A84C]/20 rounded-md px-2 py-0.5 font-bold"
                          >
                            {s.service.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {res.notes && (
                      <p className="text-[11px] text-zinc-500 italic bg-zinc-50 p-2 rounded-lg border border-zinc-150">
                        "{res.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
                    {res.status === "PENDIENTE" && (
                      <button
                        type="button"
                        onClick={() => router.push(`/recepcion?reservationId=${res.id}`)}
                        className="w-full h-9 rounded-xl bg-[#C9A84C] hover:bg-[#b0903c] text-xs font-bold text-[#0A0A0C] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>Convertir en Recepción</span>
                        <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      {res.status === "PENDIENTE" && (
                        <button
                          type="button"
                          onClick={() => handleSendReminder(res.id)}
                          className="flex-1 h-8 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title="Enviar Recordatorio por WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Recordatorio</span>
                        </button>
                      )}

                      {res.status === "PENDIENTE" && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReservation(res);
                            setIsModalOpen(true);
                          }}
                          className="h-8 w-8 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
                          title="Editar Reserva"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {res.status !== "CANCELADA" && (
                        <button
                          type="button"
                          onClick={() => setDeletingReservation(res)}
                          className="h-8 w-8 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
                          title="Cancelar Cita"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ReservaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReservation(null);
        }}
        clients={clients}
        brands={brands}
        services={services}
        initialData={editingReservation}
      />

      {/* Custom Danger Confirmation Modal for Cancellation */}
      {deletingReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-page-entry text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shrink-0 shadow-2xs">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-zinc-900">
                ¿Cancelar la cita {deletingReservation.code}?
              </h3>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Estás a punto de cancelar la reserva de <strong className="text-zinc-800">{deletingReservation.client.name}</strong>. Esta acción cambiará el estado de la cita a <strong className="text-red-600 font-bold">CANCELADA</strong>.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingReservation(null)}
                disabled={isDeletingPending}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-all cursor-pointer"
              >
                Volver atrás
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelReservation}
                disabled={isDeletingPending}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingPending ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Cancelando...</span>
                  </>
                ) : (
                  <span>Sí, Cancelar Cita</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
