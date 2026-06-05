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
  createdAt: Date;
  status: {
    name: string;
  };
  client: {
    name: string;
    phone: string;
  };
  car: {
    plate: string;
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
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-end">
                    {/* Empezar Trabajo (RECIBIDO -> EN_PROCESO) */}
                    {statusName === "RECIBIDO" && (
                      <button
                        onClick={() =>
                          handleStatusChange(order.id, "EN_PROCESO")
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
                      >
                        <Clock className="h-4 w-4" />
                        Iniciar Trabajo
                      </button>
                    )}

                    {/* Listo para Entrega (EN_PROCESO -> LISTO) */}
                    {statusName === "EN_PROCESO" && (
                      <button
                        onClick={() => handleStatusChange(order.id, "LISTO")}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar como Listo
                      </button>
                    )}

                    {/* Entregar Vehículo (LISTO -> ENTREGADO) */}
                    {statusName === "LISTO" && (
                      <button
                        onClick={() =>
                          handleStatusChange(order.id, "ENTREGADO")
                        }
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#9A7A28] px-4 py-2.5 text-xs font-bold text-[#0A0A0C] transition-colors shadow-xs"
                      >
                        <ArrowDownLeft className="h-4 w-4" />
                        Confirmar Entrega
                      </button>
                    )}

                    {/* Entregado (ENTREGADO) */}
                    {statusName === "ENTREGADO" && (
                      <div className="w-full text-center py-2 text-xs font-semibold text-zinc-400 flex items-center justify-center gap-1.5 bg-zinc-50 rounded-lg border border-zinc-200">
                        <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                        Orden Completada y Entregada
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
