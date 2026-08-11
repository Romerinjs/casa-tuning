import Link from "next/link";
import prisma from "@/lib/prisma";
import { verifySession } from "@/lib/auth-helpers";
import {
  Clock,
  CheckCircle,
  Plus,
  BarChart3,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import DashboardFAB from "@/components/DashboardFAB";

export default async function DashboardPage() {
  await verifySession();

  // 1. Calculate today's boundaries
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 2. Fetch stats from database in parallel
  const [
    inProgressCount,
    deliveredUnsignedCount,
    receivedTodayCount,
    totalTodayCount,
    activeOrders,
    recentActivities,
  ] = await Promise.all([
    // En proceso
    prisma.order.count({
      where: { status: { name: "EN_PROCESO" } },
    }),
    // Entregados sin firmar (ENTREGADO con signatureUrl null)
    prisma.order.count({
      where: {
        status: { name: "ENTREGADO" },
        signatureUrl: null,
      },
    }),
    // Recibidos hoy
    prisma.order.count({
      where: {
        status: { name: "RECIBIDO" },
        createdAt: { gte: startOfToday },
      },
    }),
    // Total del día
    prisma.order.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    // Active orders (not delivered yet, or delivered but unsigned)
    prisma.order.findMany({
      where: {
        OR: [
          {
            status: {
              name: { not: "ENTREGADO" },
            },
          },
          {
            status: { name: "ENTREGADO" },
            signatureUrl: null,
          },
        ],
      },
      include: {
        client: {
          include: {
            documentType: true,
          },
        },
        car: {
          include: { brand: true },
        },
        status: true,
        services: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Recent activities
    prisma.activityLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          include: { car: true },
        },
      },
    }),
  ]);

  // Date formatter helper in Spanish
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const dateStr = new Date().toLocaleDateString("es-ES", options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  };

  // Status badge styles mapping
  const getStatusStyles = (statusName: string, hasSignature: boolean = false) => {
    switch (statusName) {
      case "RECIBIDO":
        return "bg-blue-50 text-blue-700 border-blue-200/60 before:bg-blue-500";
      case "EN_PROCESO":
        return "bg-orange-50 text-orange-700 border-orange-200/60 before:bg-orange-500";
      case "ENTREGADO":
        return hasSignature
          ? "bg-green-50 text-green-700 border-green-200/60 before:bg-green-500"
          : "bg-zinc-100 text-zinc-600 border-zinc-200 before:bg-zinc-400";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200 before:bg-zinc-400";
    }
  };

  const getStatusLabel = (statusName: string, hasSignature: boolean = false) => {
    switch (statusName) {
      case "RECIBIDO":
        return "Recibido";
      case "EN_PROCESO":
        return "En proceso";
      case "ENTREGADO":
        return hasSignature ? "Entregado" : "Firma pendiente";
      default:
        return statusName;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">
          Dashboard
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-full border border-zinc-200">
            {getFormattedDate()}
          </span>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* En proceso */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              En proceso
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {inProgressCount}
              </span>
              <Clock className="h-6 w-6 text-orange-500/80" />
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">
              Trabajos activos
            </span>
          </div>

          {/* Entregados sin firmar */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Entregas sin firmar
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {deliveredUnsignedCount}
              </span>
              <CheckCircle className="h-6 w-6 text-rose-500/80" />
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">
              Firma digital pendiente
            </span>
          </div>

          {/* Recibidos hoy */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Recibidos hoy
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {receivedTodayCount}
              </span>
              <Plus className="h-6 w-6 text-blue-500/80" />
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">
              Nuevos registros hoy
            </span>
          </div>

          {/* Total del día */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Total del día
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {totalTodayCount}
              </span>
              <BarChart3 className="h-6 w-6 text-zinc-400" />
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">
              Volumen diario general
            </span>
          </div>
        </div>

        {/* PANEL ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ACTIVE ORDERS */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                <ClipboardList className="h-4.5 w-4.5 text-[#C9A84C]" />
                Órdenes activas
              </h3>
              <Link
                href="/ordenes"
                className="text-xs font-semibold text-[#9A7A28] hover:text-[#C9A84C] flex items-center gap-0.5 transition-colors"
              >
                Ver todas
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div>
              {activeOrders.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">
                  No hay órdenes activas registradas.
                </div>
              ) : (
                <>
                  {/* Vista de Escritorio: Tabla */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          <th className="py-3 px-5">Placa</th>
                          <th className="py-3 px-5">Cliente / Vehículo</th>
                          <th className="py-3 px-5">Servicios</th>
                          <th className="py-3 px-5">Estado</th>
                          <th className="py-3 px-5">Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {activeOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-zinc-50/70 transition-colors text-sm group"
                          >
                            <td className="py-3.5 px-5">
                              <span className="font-mono font-bold text-xs bg-zinc-100 border border-zinc-300 rounded px-2.5 py-1 text-zinc-800 tracking-wider">
                                {order.car.plate}
                              </span>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="font-semibold text-zinc-900">
                                {order.client.name}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {order.car.brand.name} {order.car.model} ({order.car.year})
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex flex-wrap gap-1">
                                {order.services.map((item) => (
                                  <span
                                    key={item.serviceId}
                                    className="text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5"
                                  >
                                    {item.service.name}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-5">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full ${getStatusStyles(
                                  order.status.name,
                                  !!order.signatureUrl
                                )}`}
                              >
                                {getStatusLabel(order.status.name, !!order.signatureUrl)}
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-xs text-zinc-400">
                              {order.createdAt.toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista de Móviles: Tarjetas */}
                  <div className="md:hidden divide-y divide-zinc-100">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="p-5 flex flex-col gap-3">
                        {/* Cabecera: Placa y Estado */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs bg-zinc-100 border border-zinc-300 rounded px-2.5 py-1 text-zinc-800 tracking-wider">
                            {order.car.plate}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full ${getStatusStyles(
                              order.status.name,
                              !!order.signatureUrl
                            )}`}
                          >
                            {getStatusLabel(order.status.name, !!order.signatureUrl)}
                          </span>
                        </div>

                        {/* Cuerpo: Cliente y Vehículo */}
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-zinc-900 text-sm">
                            {order.client.name}
                          </h4>
                          <p className="text-xs text-zinc-500">
                            {order.car.brand.name} {order.car.model} ({order.car.year})
                          </p>
                        </div>

                        {/* Pie: Servicios y Hora */}
                        <div className="flex items-center justify-between gap-4 pt-1">
                          <div className="flex flex-wrap gap-1 max-w-[70%]">
                            {order.services.map((item) => (
                              <span
                                key={item.serviceId}
                                className="text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200 rounded px-2 py-0.5"
                              >
                                {item.service.name}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-zinc-400 shrink-0">
                            {order.createdAt.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-200">
              <h3 className="text-sm font-bold text-zinc-900">
                Actividad reciente
              </h3>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {recentActivities.length === 0 ? (
                <div className="text-center text-zinc-400 text-sm py-8">
                  Sin actividad registrada aún.
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div key={act.id} className="flex gap-3 items-start text-sm">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200 text-zinc-600">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-zinc-700 leading-snug">
                        {act.order?.car.plate ? (
                          <>
                            <strong className="font-bold text-zinc-900">
                              {act.order.car.plate}
                            </strong>{" "}
                            — {act.description}
                          </>
                        ) : (
                          act.description
                        )}
                      </p>
                      <span className="text-[10px] text-zinc-400 block">
                        {act.createdAt.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        {act.createdAt.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) for Register Vehicle */}
      <DashboardFAB />
    </div>
  );
}
