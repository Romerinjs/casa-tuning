"use client";

import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/(authenticated)/ordenes/actions";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Clock,
  CheckCircle2,
  ArrowDownLeft,
  Calendar,
  Phone,
  User,
} from "lucide-react";

interface OrderService {
  service: {
    name: string;
  };
}

interface OrderData {
  id: number;
  code: string;
  mileage: string | null;
  signatureUrl: string | null;
  observations: string | null;
  checklist: any;
  createdAt: Date;
  status: {
    name: string;
  };
  client: {
    name: string;
    phone: string;
    phone2: string | null;
    documentNumber: string | null;
    documentType: {
      code: string;
      name: string;
    } | null;
  };
  car: {
    plate: string;
    type: string;
    model: string;
    year: number;
    brand: {
      name: string;
    };
  };
  services: OrderService[];
}

interface OrdenesClientViewProps {
  orders: OrderData[];
}

export default function OrdenesClientView({ orders }: OrdenesClientViewProps) {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [, startTransition] = useTransition();

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, nextStatus);
      if (!res.success) {
        showToast(res.error || "Error al actualizar estado", "error");
      } else {
        showToast(`Orden actualizada a ${getStatusLabel(nextStatus)}`, "success");
      }
      setUpdatingId(null);
    });
  };

  const getStatusStyles = (statusName: string) => {
    switch (statusName) {
      case "RECIBIDO":
        return "bg-blue-50 text-blue-700 border-blue-200/60 before:bg-blue-500";
      case "EN_PROCESO":
        return "bg-orange-50 text-orange-700 border-orange-200/60 before:bg-orange-500";
      case "LISTO":
        return "bg-green-50 text-green-700 border-green-200/60 before:bg-green-500";
      case "ENTREGADO":
        return "bg-zinc-100 text-zinc-600 border-zinc-200 before:bg-zinc-400";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200 before:bg-zinc-400";
    }
  };

  const getStatusLabel = (statusName: string) => {
    switch (statusName) {
      case "RECIBIDO":
        return "Recibido";
      case "EN_PROCESO":
        return "En proceso";
      case "LISTO":
        return "Listo para entrega";
      case "ENTREGADO":
        return "Entregado";
      default:
        return statusName;
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.car.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "TODOS" || order.status.name === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">
          Órdenes del Sistema
        </h2>
      </header>

      {/* FILTER BAR AND CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Text search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por placa, cliente o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:outline-none transition-colors"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex bg-zinc-100 rounded-lg p-1 border border-zinc-200 select-none overflow-x-auto max-w-full">
            {["TODOS", "RECIBIDO", "EN_PROCESO", "LISTO", "ENTREGADO"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    statusFilter === status
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {status === "TODOS" ? "Todos" : getStatusLabel(status)}
                </button>
              )
            )}
          </div>
        </div>

        {/* LIST RENDER */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
            No se encontraron órdenes registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const isUpdating = updatingId === order.id;
              const statusName = order.status.name;

              return (
                <div
                  key={order.id}
                  className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  {isUpdating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-10 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                    </div>
                  )}

                  {/* Header info */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#9A7A28]">
                          {order.code}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(order.createdAt).toLocaleDateString(
                              "es-ES"
                            )}{" "}
                            {new Date(order.createdAt).toLocaleTimeString(
                              "es-ES",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full ${getStatusStyles(
                          statusName
                        )}`}
                      >
                        {getStatusLabel(statusName)}
                      </span>
                    </div>

                    {/* Car and Client info */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: Car detail */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Vehículo
                        </span>
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-bold text-[11px] bg-zinc-100 border border-zinc-300 rounded px-1.5 py-0.5 tracking-wider text-zinc-800 shrink-0">
                            {order.car.plate}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-800 truncate leading-tight">
                              {order.car.brand.name} {order.car.model}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              Año {order.car.year}
                              {order.mileage && ` · ${order.mileage}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Client detail */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Cliente
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-zinc-800 truncate flex items-center gap-1 leading-tight">
                            <User className="h-3 w-3 text-zinc-400 shrink-0" />
                            {order.client.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                            {order.client.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Services row */}
                    <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Servicios contratados
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {order.services.map((s, index) => (
                          <span
                            key={index}
                            className="text-[10px] bg-zinc-50 border border-zinc-200 rounded px-2 py-0.5 text-zinc-600 font-semibold"
                          >
                            {s.service.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-600 transition-colors cursor-pointer shrink-0 select-none"
                    >
                      Ver Ficha
                    </button>

                    {/* Empezar Trabajo (RECIBIDO -> EN_PROCESO) */}
                    {statusName === "RECIBIDO" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(order.id, "EN_PROCESO")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer select-none"
                      >
                        <Clock className="h-4 w-4" />
                        Iniciar
                      </button>
                    )}

                    {/* Listo para Entrega (EN_PROCESO -> LISTO) */}
                    {statusName === "EN_PROCESO" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "LISTO")}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer select-none"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Listo
                      </button>
                    )}

                    {/* Entregar Vehículo (LISTO -> ENTREGADO) */}
                    {statusName === "LISTO" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(order.id, "ENTREGADO")
                        }
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-colors shadow-xs cursor-pointer select-none"
                      >
                        <ArrowDownLeft className="h-4 w-4" />
                        Entregar
                      </button>
                    )}

                    {/* Entregado (ENTREGADO) */}
                    {statusName === "ENTREGADO" && (
                      <div className="flex-1 text-center py-2 text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
                        <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                        Entregado
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div 
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50 shrink-0">
              <div>
                <span className="font-mono font-bold text-xs text-[#9A7A28] uppercase tracking-wider block">
                  Ficha Técnica de Recepción
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 mt-0.5">
                  Orden {selectedOrder.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-9 w-9 rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer select-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Client and Car information grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Client Box */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-200 pb-1.5">
                    Información del Cliente
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-zinc-400 block">Nombre Completo</span>
                      <span className="font-bold text-zinc-800">{selectedOrder.client.name}</span>
                    </div>
                    {selectedOrder.client.documentNumber && (
                      <div>
                        <span className="text-zinc-400 block">
                          {selectedOrder.client.documentType ? selectedOrder.client.documentType.name : "Documento"}
                        </span>
                        <span className="font-semibold text-zinc-850">
                          {selectedOrder.client.documentType ? `${selectedOrder.client.documentType.code} ` : ""}
                          {selectedOrder.client.documentNumber}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-zinc-400 block">Celular / WhatsApp</span>
                        <span className="font-semibold text-zinc-850">{selectedOrder.client.phone}</span>
                      </div>
                      <a
                        href={`https://wa.me/57${selectedOrder.client.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-green-50 text-green-700 hover:bg-green-100 font-bold px-2 py-1 rounded border border-green-200 transition-colors inline-flex items-center gap-1 select-none"
                      >
                        WhatsApp
                      </a>
                    </div>
                    {selectedOrder.client.phone2 && (
                      <div>
                        <span className="text-zinc-400 block">Teléfono Alternativo</span>
                        <span className="font-semibold text-zinc-850">{selectedOrder.client.phone2}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Box */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-200 pb-1.5">
                    Información del Vehículo
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-zinc-400 block">Placa</span>
                        <span className="font-mono font-bold text-xs bg-zinc-200 border border-zinc-350 rounded px-2 py-0.5 tracking-wider text-zinc-800 inline-block mt-0.5">
                          {selectedOrder.car.plate}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-zinc-250 bg-white text-zinc-500 font-semibold select-none">
                        {selectedOrder.car.type || "Automóvil"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Vehículo</span>
                      <span className="font-bold text-zinc-800">
                        {selectedOrder.car.brand.name} {selectedOrder.car.model} ({selectedOrder.car.year})
                      </span>
                    </div>
                    {selectedOrder.mileage && (
                      <div>
                        <span className="text-zinc-400 block">Kilometraje de Ingreso</span>
                        <span className="font-semibold text-zinc-855">{selectedOrder.mileage} KM</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Services row */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Servicios Solicitados
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedOrder.services.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#FBF5E6]/60 border border-[#C9A84C]/35 rounded px-2.5 py-1 text-[#9A7A28] font-bold select-none"
                    >
                      {s.service.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Checklist Section */}
              {selectedOrder.checklist && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block border-b border-zinc-150 pb-1">
                    Checklist de Inspección de Recepción
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(
                      selectedOrder.checklist as Record<string, string>
                    ).map(([key, value]) => {
                      let displayLabel = key
                        .replace(/_/g, " ")
                        .replace(/^\w/, (c) => c.toUpperCase());
                      
                      // Custom labels mapping
                      if (key === "rayones") displayLabel = "Rayones";
                      if (key === "golpes") displayLabel = "Golpes";
                      if (key === "pintura") displayLabel = "Estado de pintura";
                      if (key === "rines") displayLabel = "Estado de rines";
                      if (key === "vidrios") displayLabel = "Estado de vidrios";
                      if (key === "parabrisas") displayLabel = "Estado de parabrisas";
                      if (key === "farolas") displayLabel = "Estado de farolas";
                      if (key === "cojineria") displayLabel = "Estado de cojinería";
                      if (key === "tablero") displayLabel = "Estado del tablero";
                      if (key === "general_interior") displayLabel = "Estado general interior";
                      if (key === "testigos") displayLabel = "Testigos encendidos";
                      if (key === "vidrios_electricos") displayLabel = "Vidrios eléctricos";
                      if (key === "luces") displayLabel = "Luces";
                      if (key === "direccionales") displayLabel = "Direccionales";
                      if (key === "reversa") displayLabel = "Reversa";
                      if (key === "estacionarias") displayLabel = "Estacionarias";
                      if (key === "pito") displayLabel = "Pito";
                      if (key === "plumillas") displayLabel = "Plumillas";
                      if (key === "espejos") displayLabel = "Espejos";
                      if (key === "lineas_termicas") displayLabel = "Líneas térmicas";

                      return (
                        <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-zinc-100">
                          <span className="text-zinc-650 font-medium">{displayLabel}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider select-none ${
                              value === "bueno" || value === "no"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : value === "malo" || value === "si"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                            }`}
                          >
                            {value === "bueno"
                              ? "Bueno"
                              : value === "malo"
                              ? "Malo"
                              : value === "si"
                              ? "Sí"
                              : value === "no"
                              ? "No"
                              : "N/A"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observations */}
              {selectedOrder.observations && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Observaciones registradas
                  </h4>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-700 whitespace-pre-wrap leading-relaxed font-medium">
                    {selectedOrder.observations}
                  </div>
                </div>
              )}

              {/* Signature display */}
              {selectedOrder.signatureUrl && (
                <div className="pt-4 border-t border-zinc-150 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Firma de Conformidad del Cliente
                  </span>
                  <div className="border border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-center p-4 max-w-xs overflow-hidden h-28">
                    <img 
                      src={selectedOrder.signatureUrl} 
                      alt="Firma del Cliente" 
                      className="max-h-full max-w-full object-contain mix-blend-multiply" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent && !parent.querySelector('.signature-fallback-msg')) {
                          const errorLabel = document.createElement('span');
                          errorLabel.className = 'text-xs text-zinc-400 italic font-semibold signature-fallback-msg';
                          errorLabel.innerText = 'Firma digital registrada';
                          parent.appendChild(errorLabel);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-150 flex justify-end bg-zinc-50 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="h-10 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition-colors cursor-pointer select-none"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
