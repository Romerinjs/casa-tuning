"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  updateOrderStatusAction,
  uploadDeliveryPdfAction,
  deleteDeliveryPdfAction,
  addOrderCommentAction,
  downloadOrderPdfAction,
  hideOrderFromOrdersPanelAction,
  saveOrderSignatureAction,
  notifyCustomerOrderReadyAction,
} from "@/app/(authenticated)/ordenes/actions";
import HideOrderModal from "@/components/HideOrderModal";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Clock,
  CheckCircle2,
  ArrowDownLeft,
  Calendar,
  Phone,
  User,
  FileText,
  Trash2,
  UploadCloud,
  Send,
  MessageSquare,
  Download,
  ChevronDown,
  ChevronRight,
  Edit,
} from "lucide-react";

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

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
  serviceDescription: string | null;
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
      logo: string | null;
    };
  };
  services: OrderService[];
  deliveryPdfUrl: string | null;
  comments: {
    id: number;
    content: string;
    createdAt: Date;
    user: {
      name: string;
      role: {
        name: string;
      };
    };
  }[];
}

interface OrdenesClientViewProps {
  orders: OrderData[];
}

export default function OrdenesClientView({ orders }: OrdenesClientViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [activeGalleryKey, setActiveGalleryKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hideOrderTarget, setHideOrderTarget] = useState<OrderData | null>(null);
  const [hideOrderError, setHideOrderError] = useState<string | null>(null);

  const [isUploadingPdf, setIsUploadingPdf] = useState<number | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState<number | null>(null);
  const [collapsedOrders, setCollapsedOrders] = useState<Record<number, boolean>>({});

  // Delivery modal and signature states (NUEVO)
  const [deliveryOrder, setDeliveryOrder] = useState<OrderData | null>(null);
  const [deliverySignatureData, setDeliverySignatureData] = useState("");
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [detailsSignatureData, setDetailsSignatureData] = useState("");
  const [notifyingOrderId, setNotifyingOrderId] = useState<number | null>(null);
  const [deletePdfTarget, setDeletePdfTarget] = useState<OrderData | null>(null);

  // Canvas drawing variables for modal
  useEffect(() => {
    const canvas = document.getElementById("details-sig-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let drawing = false;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      drawing = true;
      const coords = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const coords = getCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      drawing = false;
      setDetailsSignatureData(canvas.toDataURL());
    };

    const getCoords = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const cRect = canvas.getBoundingClientRect();
      return {
        x: clientX - cRect.left,
        y: clientY - cRect.top
      };
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [selectedOrder]);

  // Canvas drawing variables for delivery modal
  useEffect(() => {
    const canvas = document.getElementById("delivery-sig-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.strokeStyle = "#18181b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let drawing = false;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      drawing = true;
      const coords = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return;
      e.preventDefault();
      const coords = getCoords(e);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      drawing = false;
      setDeliverySignatureData(canvas.toDataURL());
    };

    const getCoords = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const cRect = canvas.getBoundingClientRect();
      return {
        x: clientX - cRect.left,
        y: clientY - cRect.top
      };
    };

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", startDrawing, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDrawing);

    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseleave", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [deliveryOrder]);

  const clearDetailsSignature = () => {
    const canvas = document.getElementById("details-sig-canvas") as HTMLCanvasElement | null;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDetailsSignatureData("");
      }
    }
  };

  const clearDeliverySignature = () => {
    const canvas = document.getElementById("delivery-sig-canvas") as HTMLCanvasElement | null;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDeliverySignatureData("");
      }
    }
  };

  const handleOpenSelectedOrder = (order: OrderData) => {
    setDetailsSignatureData("");
    setSelectedOrder(order);
  };

  const handleCloseSelectedOrder = () => {
    setDetailsSignatureData("");
    setSelectedOrder(null);
  };

  const handleSaveDetailsSignature = async (orderId: number) => {
    if (!detailsSignatureData) {
      showToast("Por favor, dibuje la firma primero.", "warning");
      return;
    }

    setIsSavingSignature(true);
    try {
      const res = await saveOrderSignatureAction(orderId, detailsSignatureData);
      if (res.success) {
        showToast("Firma registrada y entrega completada con éxito.", "success");
        handleCloseSelectedOrder();
      } else {
        showToast(res.error || "Error al guardar la firma.", "error");
      }
    } catch (err) {
      console.error("Error saving signature:", err);
      showToast("Error al conectar con el servidor.", "error");
    } finally {
      setIsSavingSignature(false);
    }
  };

  const handleNotifyOrderReady = async (order: OrderData) => {
    setNotifyingOrderId(order.id);
    try {
      const res = await notifyCustomerOrderReadyAction(order.id);
      if (res.success) {
        showToast(`Notificación enviada a ${order.client.name} vía WhatsApp.`, "success");
      } else {
        showToast(res.error || "No se pudo enviar la notificación.", "error");
      }
    } catch (err: any) {
      console.error("Error notifying client:", err);
      showToast("Error de conexión al enviar la notificación.", "error");
    } finally {
      setNotifyingOrderId(null);
    }
  };

  const handleCompleteDelivery = async (orderId: number) => {
    if (!deliverySignatureData) {
      showToast("Por favor, dibuje la firma del cliente para completar la entrega.", "warning");
      return;
    }

    setIsSavingDelivery(true);
    try {
      // 1. Save client signature
      const sigRes = await saveOrderSignatureAction(orderId, deliverySignatureData);
      if (!sigRes.success) {
        showToast(sigRes.error || "Error al guardar la firma.", "error");
        setIsSavingDelivery(false);
        return;
      }

      // 2. Change status to ENTREGADO
      const res = await updateOrderStatusAction(orderId, "ENTREGADO");
      if (!res.success) {
        showToast(res.error || "Error al actualizar estado a Entregado", "error");
        setIsSavingDelivery(false);
        return;
      }
      
      showToast("Vehículo entregado y firmado con éxito.", "success");
      setDeliveryOrder(null);
      setDeliverySignatureData("");
    } catch (err) {
      console.error("Error in delivery workflow:", err);
      showToast("Error en el proceso de entrega.", "error");
    } finally {
      setIsSavingDelivery(false);
    }
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

  const handleOpenHideOrderModal = (order: OrderData) => {
    setHideOrderError(null);
    setHideOrderTarget(order);
  };

  const handleCloseHideOrderModal = () => {
    setHideOrderError(null);
    setHideOrderTarget(null);
  };

  const handleRequestSignature = () => {
    if (!hideOrderTarget) return;

    const order = hideOrderTarget;
    setHideOrderError(null);
    setHideOrderTarget(null);
    handleOpenSelectedOrder(order);
  };

  const handleConfirmHideOrder = () => {
    if (!hideOrderTarget) return;

    const orderId = hideOrderTarget.id;
    setHideOrderError(null);

    startTransition(async () => {
      try {
        const result = await hideOrderFromOrdersPanelAction(orderId);

        if (!result.success) {
          setHideOrderError(
            result.error || "No fue posible ocultar la orden.",
          );
          return;
        }

        setHideOrderTarget(null);
        showToast("Orden ocultada del panel con éxito.", "success");
      } catch (error) {
        console.error("Error hiding order from orders panel:", error);
        setHideOrderError("No fue posible ocultar la orden.");
      }
    });
  };

  const toggleCollapse = (orderId: number, currentCollapsed: boolean) => {
    setCollapsedOrders((prev) => ({
      ...prev,
      [orderId]: !currentCollapsed,
    }));
  };

  // Sync selectedOrder with updated orders prop (e.g. after comments or status update)
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find((o) => o.id === selectedOrder.id);
      if (updated) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder?.id]);

  const handlePdfUpload = (orderId: number, file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      showToast("El archivo seleccionado debe ser un documento PDF.", "warning");
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast("El archivo PDF no debe superar los 5MB de tamaño.", "warning");
      return;
    }

    setIsUploadingPdf(orderId);
    const formData = new FormData();
    formData.append("orderId", orderId.toString());
    formData.append("file", file);

    startTransition(async () => {
      try {
        const res = await uploadDeliveryPdfAction(formData);
        if (res.success) {
          showToast("Documento de entrega PDF cargado con éxito.", "success");
        } else {
          showToast(res.error || "Error al cargar el documento", "error");
        }
      } catch (err: any) {
        console.error("Error uploading PDF:", err);
        showToast(`Error al subir el documento: ${err?.message || "No se pudo completar la operación."}`, "error");
      } finally {
        setIsUploadingPdf(null);
      }
    });
  };

  const handlePdfDelete = (orderId: number) => {
    setIsUploadingPdf(orderId);
    startTransition(async () => {
      try {
        const res = await deleteDeliveryPdfAction(orderId);
        if (res.success) {
          showToast("Documento de entrega PDF eliminado.", "success");
        } else {
          showToast(res.error || "Error al eliminar el documento", "error");
        }
      } catch (err: any) {
        console.error("Error deleting PDF:", err);
        showToast(`Error al eliminar el documento: ${err?.message || "No se pudo completar la operación."}`, "error");
      } finally {
        setIsUploadingPdf(null);
      }
    });
  };

  const handleAddComment = async (e: React.FormEvent<HTMLFormElement>, orderId: number) => {
    e.preventDefault();
    const form = e.currentTarget;
    const textarea = form.elements.namedItem("commentContent") as HTMLTextAreaElement;
    const content = textarea.value;

    if (!content.trim()) return;

    setIsSubmittingComment(true);
    startTransition(async () => {
      try {
        const res = await addOrderCommentAction(orderId, content);
        if (res.success) {
          showToast("Comentario agregado con éxito.", "success");
          textarea.value = "";
        } else {
          showToast(res.error || "Error al agregar el comentario", "error");
        }
      } catch (err: any) {
        console.error("Error adding comment:", err);
        showToast(`Error al agregar el comentario: ${err?.message || "No se pudo completar la operación."}`, "error");
      } finally {
        setIsSubmittingComment(false);
      }
    });
  };

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId);
    startTransition(async () => {
      try {
        const res = await updateOrderStatusAction(orderId, nextStatus);
        if (!res.success) {
          showToast(res.error || "Error al actualizar estado", "error");
        } else {
          showToast(`Orden actualizada a ${getStatusLabel(nextStatus)}`, "success");
        }
      } catch (err: any) {
        console.error("Error updating status:", err);
        showToast(`Error al actualizar el estado: ${err?.message || "No se pudo completar la operación."}`, "error");
      } finally {
        setUpdatingId(null);
      }
    });
  };

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

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.car.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.car.brand.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "TODOS" || order.status.name === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort logic: RECIBIDO (0) -> EN_PROCESO (1) -> ENTREGADO sin firmar (2) -> ENTREGADO firmado (3)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const getPriority = (orderObj: any) => {
      const name = orderObj.status.name;
      if (name === "RECIBIDO") return 0;
      if (name === "EN_PROCESO") return 1;
      if (name === "ENTREGADO" && !orderObj.signatureUrl) return 2;
      return 3;
    };

    const pA = getPriority(a);
    const pB = getPriority(b);
    if (pA !== pB) {
      return pA - pB;
    }
    // Newest first if status priority is the same
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-page-entry">
        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60 shadow-xs">
          {/* Text search */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por placa, cliente o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/15 focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex bg-zinc-150/80 rounded-lg p-0.5 border border-zinc-200/30 select-none overflow-x-auto max-w-full">
            {["TODOS", "RECIBIDO", "EN_PROCESO", "ENTREGADO"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-md text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${statusFilter === status
                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/50"
                    : "text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  {status === "TODOS" ? "Todos" : getStatusLabel(status, status === "ENTREGADO")}
                </button>
              )
            )}
          </div>
        </div>

        {/* LIST RENDER */}
        {sortedOrders.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 shadow-sm">
            <p className="font-medium text-sm">No se encontraron órdenes registradas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {sortedOrders.map((order) => {
              const isUpdating = updatingId === order.id;
              const statusName = order.status.name;
              const isCollapsed = collapsedOrders[order.id] !== undefined
                ? collapsedOrders[order.id]
                : statusName === "ENTREGADO";

              return (
                <div
                  key={order.id}
                  className={`bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-250 relative overflow-hidden flex flex-col ${isCollapsed ? "" : "justify-between"}`}
                >
                  {isUpdating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-xs z-10 flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                    </div>
                  )}

                  {/* Header info */}
                  <div className="space-y-5">
                    <div
                      className="flex items-center justify-between border-b border-zinc-100 pb-4 cursor-pointer select-none"
                      onClick={() => toggleCollapse(order.id, isCollapsed)}
                    >
                      <div>
                        <span className="font-mono font-bold text-[11px] text-[#9A7A28] bg-[#FBF5E6]/90 px-2.5 py-1 rounded-md border border-[#C9A84C]/25 shadow-2xs">
                          {order.code}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-2">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
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
                      <div className="flex items-center gap-2">
                        {statusName === "ENTREGADO" && !order.signatureUrl && (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60) > 12 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 animate-pulse select-none">
                            ⚠️ Falta firma (&gt;12h)
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full ${getStatusStyles(
                            statusName,
                            !!order.signatureUrl
                          )}`}
                        >
                          {getStatusLabel(statusName, !!order.signatureUrl)}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`} />
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-4 pt-1 animate-[scaleIn_0.15s_ease-out]">
                        {/* Car and Client info sub-card */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/50 p-4 rounded-xl border border-zinc-150/60 shadow-2xs">
                          {/* Left: Car detail */}
                          <div className="space-y-2">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                              Vehículo
                            </span>
                            <div className="flex items-start gap-2.5">
                              {order.car.brand.logo ? (
                                <div className="h-7 w-7 rounded bg-zinc-50 border border-zinc-150 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                                  <img src={order.car.brand.logo} alt={order.car.brand.name} className="h-full w-full object-contain" />
                                </div>
                              ) : (
                                <div className="h-7 w-7 rounded bg-[#FBF5E6] text-[#9A7A28] border border-[#C9A84C]/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {order.car.brand.name.substring(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="font-mono font-extrabold text-[10.5px] bg-[#FCD34D]/25 text-[#78350F] border border-[#F59E0B]/30 rounded px-1.5 py-0.5 tracking-wider shrink-0 select-none shadow-2xs">
                                {order.car.plate}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-zinc-800 truncate leading-tight">
                                  {order.car.brand.name} {order.car.model}
                                </p>
                                <p className="text-[10px] text-zinc-450 mt-1">
                                  Año {order.car.year}
                                  {order.mileage && ` · ${order.mileage} KM`}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Right: Client detail */}
                          <div className="space-y-2 sm:border-l sm:border-zinc-200/60 sm:pl-4">
                            <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                              Cliente
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-850 truncate flex items-center gap-1.5 leading-tight">
                                <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                {order.client.name}
                              </p>
                              <p className="text-[10px] text-zinc-450 mt-1.5 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                                {order.client.phone}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Services row */}
                        <div className="space-y-2 pt-2 border-t border-zinc-100">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 block">
                            Servicios contratados
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {order.services.map((s, index) => (
                              <span
                                key={index}
                                className="text-[10px] bg-[#FBF5E6]/70 border border-[#C9A84C]/20 rounded-md px-2.5 py-0.5 text-[#9A7A28] font-bold select-none"
                              >
                                {s.service.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="animate-[scaleIn_0.15s_ease-out]">
                      {/* Actions footer */}
                      <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300 px-4 text-xs font-bold text-zinc-700 transition-all cursor-pointer select-none shadow-2xs"
                          >
                            Ver Ficha
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(order.id)}
                            disabled={downloadingPdfId === order.id}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-zinc-200/80 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-750 transition-all cursor-pointer select-none disabled:opacity-50 shadow-2xs"
                            title="Descargar Ficha Técnica en PDF"
                          >
                            {downloadingPdfId === order.id ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                          {statusName === "EN_PROCESO" && (
                            <button
                              type="button"
                              onClick={() => handleNotifyOrderReady(order)}
                              disabled={notifyingOrderId === order.id}
                              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-emerald-200/90 bg-emerald-50/80 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800 transition-all cursor-pointer select-none disabled:opacity-50 shadow-2xs group"
                              title="Notificar al cliente por WhatsApp (Vehículo listo para retiro)"
                              aria-label={`Notificar al cliente de la orden ${order.code}`}
                            >
                              {notifyingOrderId === order.id ? (
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                              ) : (
                                <Send className="h-4 w-4 text-emerald-600 group-hover:text-emerald-800 transition-colors" />
                              )}
                            </button>
                          )}
                          {statusName === "ENTREGADO" ? (
                            <button
                              type="button"
                              aria-label={`Ocultar orden ${order.code}`}
                              onClick={() => handleOpenHideOrderModal(order)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200/80 text-zinc-500 shadow-2xs transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>

                        {/* Empezar Trabajo (RECIBIDO -> EN_PROCESO) y Editar */}
                        {statusName === "RECIBIDO" && (
                          <>
                            <button
                              type="button"
                              onClick={() => router.push(`/recepcion?edit=${order.id}`)}
                              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-zinc-200/85 hover:bg-[#FBF5E6]/40 hover:border-[#C9A84C]/50 text-[#9A7A28] text-xs font-bold px-3 transition-all cursor-pointer select-none shadow-2xs"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(order.id, "EN_PROCESO")
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-xs font-bold text-white transition-all shadow-xs cursor-pointer select-none"
                            >
                              <Clock className="h-4 w-4" />
                              Iniciar
                            </button>
                          </>
                        )}

                        {/* Entregar Vehículo (EN_PROCESO -> ENTREGADO) */}
                        {statusName === "EN_PROCESO" && (
                          <button
                            type="button"
                            onClick={() => setDeliveryOrder(order)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-[#C9A84C] hover:bg-[#b0903c] text-xs font-bold text-[#0A0A0C] transition-all shadow-xs cursor-pointer select-none"
                          >
                            <ArrowDownLeft className="h-4 w-4" />
                            Entregar
                          </button>
                        )}

                        {/* Entregado (ENTREGADO) */}
                        {statusName === "ENTREGADO" && (
                          <div className={`flex-1 text-center h-9 text-xs font-bold flex items-center justify-center gap-1.5 rounded-lg border select-none ${order.signatureUrl
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-zinc-50 text-zinc-400 border-zinc-200/70"
                            }`}>
                            <CheckCircle2 className={`h-4 w-4 ${order.signatureUrl ? "text-green-600" : "text-zinc-400"}`} />
                            {order.signatureUrl ? "Entregado y Firmado" : "Entregado sin firmar"}
                          </div>
                        )}
                      </div>

                      {/* Carga y visualización de PDF de entrega (Para órdenes en ENTREGADO) */}
                      {statusName === "ENTREGADO" && (
                        <div className="mt-4 pt-3 border-t border-zinc-150 flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">
                            <span>Factura Electrónica</span>
                            {order.deliveryPdfUrl && (
                              <span className="text-green-600 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Cargado
                              </span>
                            )}
                          </div>

                          {isUploadingPdf === order.id ? (
                            <div className="border border-zinc-200/70 rounded-xl p-3.5 bg-zinc-50/50 flex items-center justify-center gap-2 text-xs text-zinc-505 font-bold select-none animate-[scaleIn_0.15s_ease-out]">
                              <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                              <span>Procesando archivo...</span>
                            </div>
                          ) : order.deliveryPdfUrl ? (
                            <div className="bg-zinc-50 border border-zinc-200 hover:border-[#C9A84C]/35 rounded-xl p-2 flex items-center justify-between gap-3 group transition-all duration-200 animate-[scaleIn_0.15s_ease-out]">
                              <a
                                  href={order.deliveryPdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-[#9A7A28] transition-colors"
                              >
                                <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
                                  <FileText className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-zinc-800 truncate">Factura_Elec_{order.code}.pdf</p>
                                  <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Ver / Descargar archivo</p>
                                </div>
                              </a>
                              <button
                                type="button"
                                onClick={() => setDeletePdfTarget(order)}
                                className="h-8.5 w-8.5 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent transition-all cursor-pointer"
                                title="Eliminar documento"
                                aria-label={`Eliminar documento de la orden ${order.code}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="border border-dashed border-zinc-200/80 hover:border-[#C9A84C]/50 hover:bg-[#FBF5E6]/10 rounded-xl p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-2 select-none group animate-[scaleIn_0.15s_ease-out]">
                              <UploadCloud className="h-4.5 w-4.5 text-zinc-400 group-hover:text-[#9A7A28] transition-colors" />
                              <span className="text-xs font-bold text-zinc-700 group-hover:text-[#9A7A28] transition-colors">Cargar PDF de Entrega</span>
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePdfUpload(order.id, file);
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {hideOrderTarget ? (
        <HideOrderModal
          order={hideOrderTarget}
          open
          pending={isPending}
          error={hideOrderError}
          onClose={handleCloseHideOrderModal}
          onRequestSignature={handleRequestSignature}
          onConfirm={handleConfirmHideOrder}
        />
      ) : null}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE FACTURA PDF */}
      {deletePdfTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 space-y-4 animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-extrabold text-zinc-900">
                ¿Eliminar Factura Electrónica?
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Se eliminará el documento PDF adjunto a la orden <strong className="text-zinc-800">{deletePdfTarget.code}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletePdfTarget(null)}
                disabled={isUploadingPdf === deletePdfTarget.id}
                className="h-10 px-4 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer select-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = deletePdfTarget.id;
                  setDeletePdfTarget(null);
                  handlePdfDelete(id);
                }}
                disabled={isUploadingPdf === deletePdfTarget.id}
                className="h-10 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white transition-colors cursor-pointer select-none disabled:opacity-50 shadow-sm"
              >
                {isUploadingPdf === deletePdfTarget.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                onClick={handleCloseSelectedOrder}
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
                        <span className="font-mono font-extrabold text-[11px] bg-[#FCD34D]/25 text-[#78350F] border border-[#F59E0B]/30 rounded px-2 py-0.5 tracking-wider inline-block mt-1 shadow-2xs">
                          {selectedOrder.car.plate}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-zinc-250 bg-white text-zinc-500 font-semibold select-none">
                        {selectedOrder.car.type || "Automóvil"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Vehículo</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {selectedOrder.car.brand.logo ? (
                          <div className="h-6 w-6 rounded bg-zinc-50 border border-zinc-150 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={selectedOrder.car.brand.logo} alt={selectedOrder.car.brand.name} className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded bg-[#FBF5E6] text-[#9A7A28] border border-[#C9A84C]/25 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {selectedOrder.car.brand.name.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-zinc-800">
                          {selectedOrder.car.brand.name} {selectedOrder.car.model} ({selectedOrder.car.year})
                        </span>
                      </div>
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

              {/* Detalles / Especificaciones de Servicios (NUEVO) */}
              {selectedOrder.serviceDescription && (
                <div className="space-y-2 pt-2 animate-[scaleIn_0.15s_ease-out]">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Detalles / Especificaciones de Servicios
                  </h4>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs text-zinc-750 whitespace-pre-wrap leading-relaxed font-medium">
                    {selectedOrder.serviceDescription}
                  </div>
                </div>
              )}

              {/* Checklist Section */}
              {selectedOrder.checklist && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block border-b border-zinc-150 pb-1">
                    Checklist de Inspección de Recepción
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {Object.entries(
                      selectedOrder.checklist as Record<string, any>
                    )
                      .filter(([key]) => !key.startsWith("_images_"))
                      .map(([key, value]) => {
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

                        const images = selectedOrder.checklist["_images_" + key] as string[] | undefined;

                        return (
                          <div key={key} className="flex flex-col py-1.5 border-b border-zinc-100 gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-650 font-medium">{displayLabel}</span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider select-none ${value === "bueno" || value === "no"
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
                            {images && images.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {images.length <= 3 ? (
                                  images.map((imgSrc, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      onClick={() => setZoomImage(imgSrc)}
                                      className="relative h-10 w-10 rounded border border-zinc-200 overflow-hidden hover:opacity-80 transition-opacity focus:outline-none cursor-pointer animate-[scaleIn_0.15s_ease-out]"
                                    >
                                      <img
                                        src={imgSrc}
                                        alt={`${displayLabel} evidence ${imgIdx + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                  ))
                                ) : (
                                  <>
                                    {images.slice(0, 2).map((imgSrc, imgIdx) => (
                                      <button
                                        key={imgIdx}
                                        type="button"
                                        onClick={() => setZoomImage(imgSrc)}
                                        className="relative h-10 w-10 rounded border border-zinc-200 overflow-hidden hover:opacity-80 transition-opacity focus:outline-none cursor-pointer animate-[scaleIn_0.15s_ease-out]"
                                      >
                                        <img
                                          src={imgSrc}
                                          alt={`${displayLabel} evidence ${imgIdx + 1}`}
                                          className="h-full w-full object-cover"
                                        />
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setActiveGalleryKey(key)}
                                      className="relative h-10 w-10 rounded border border-zinc-200 overflow-hidden hover:opacity-80 transition-opacity focus:outline-none cursor-pointer animate-[scaleIn_0.15s_ease-out]"
                                      title="Ver todas las imágenes"
                                    >
                                      <img
                                        src={images[2]}
                                        className="h-full w-full object-cover blur-[1px]"
                                      />
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white text-[10px] font-extrabold">
                                          +{images.length - 2}
                                        </span>
                                      </div>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
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

              {/* Signature display / canvas draw pad */}
              {selectedOrder.signatureUrl ? (
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
              ) : (
                selectedOrder.status.name === "ENTREGADO" && (
                  <div className="pt-4 border-t border-zinc-150 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Registrar Firma de Conformidad (Firma Pendiente)
                    </span>
                    <p className="text-xs text-zinc-500">
                      Por favor, registre la firma del cliente sobre el lienzo para completar formalmente la entrega.
                    </p>
                    <div className="border border-zinc-250 rounded-xl bg-white overflow-hidden relative h-28 w-full max-w-xs shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
                      <canvas
                        id="details-sig-canvas"
                        className="w-full h-full cursor-crosshair touch-none"
                      />
                      {detailsSignatureData && (
                        <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                          Dibujado ✓
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 max-w-xs pt-1">
                      <button
                        type="button"
                        onClick={clearDetailsSignature}
                        className="flex-1 h-8 px-3 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveDetailsSignature(selectedOrder.id)}
                        disabled={isSavingSignature}
                        className="flex-1 h-8 px-3 rounded-lg bg-[#C9A84C] hover:bg-[#b0903c] text-xs font-bold text-[#0A0A0C] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs active:scale-98"
                      >
                        {isSavingSignature ? "Guardando..." : "Guardar Firma"}
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Delivery PDF URL display inside the technical sheet */}
              {selectedOrder.deliveryPdfUrl && (
                <div className="pt-4 border-t border-zinc-150 space-y-2 animate-[scaleIn_0.15s_ease-out]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Factura Electrónica
                  </span>
                  <div className="bg-zinc-50 border border-zinc-200 hover:border-[#C9A84C]/35 rounded-xl p-2.5 flex items-center justify-between gap-3 group transition-colors max-w-sm">
                    <a
                      href={selectedOrder.deliveryPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-[#9A7A28] transition-colors"
                    >
                      <div className="h-8 w-8 rounded-lg bg-red-50 text-red-650 border border-red-100 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-850 truncate">Factura_Elec_{selectedOrder.code}.pdf</p>
                        <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Ver / Descargar</p>
                      </div>
                    </a>
                  </div>
                </div>
              )}

              {/* Notes / Comments Section */}
              <div className="pt-6 border-t border-zinc-150 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-150">
                  <MessageSquare className="h-4 w-4 text-[#C9A84C]" />
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9A7A28]">
                    Notas de Progreso y Comentarios
                  </h4>
                  <span className="ml-auto text-[10px] font-bold bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded-full border border-zinc-200">
                    {selectedOrder.comments?.length || 0}
                  </span>
                </div>

                {/* Comment Timeline */}
                {(!selectedOrder.comments || selectedOrder.comments.length === 0) ? (
                  <p className="text-xs text-zinc-400 italic py-2">
                    No hay comentarios registrados para esta orden.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                    {selectedOrder.comments.map((comment) => {
                      const userInitials = comment.user?.name ? getInitials(comment.user.name) : "U";
                      const roleName = comment.user?.role?.name || "Operador";

                      return (
                        <div
                          key={comment.id}
                          className="flex gap-3 text-xs bg-zinc-50/50 border border-zinc-100 rounded-xl p-3 animate-[scaleIn_0.15s_ease-out]"
                        >
                          {/* Squircle Gold Gradient Avatar */}
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#F5E5C9] to-[#C9A84C] text-[#5A4518] flex items-center justify-center font-extrabold text-[10px] shrink-0 border border-[#C9A84C]/20 shadow-xs select-none">
                            {userInitials}
                          </div>

                          {/* Comment Bubble Content */}
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-bold text-zinc-800 truncate">
                                  {comment.user?.name || "Usuario"}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FBF5E6]/80 text-[#9A7A28] border border-[#C9A84C]/25 select-none shrink-0">
                                  {roleName}
                                </span>
                              </div>
                              <span className="text-[9px] text-zinc-400 font-semibold shrink-0">
                                {new Date(comment.createdAt).toLocaleDateString("es-ES")} {new Date(comment.createdAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-zinc-750 font-medium whitespace-pre-wrap leading-relaxed break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment Form (Only for active states: RECIBIDO, EN_PROCESO or ENTREGADO unsigned) */}
                {(selectedOrder.status.name === "RECIBIDO" || selectedOrder.status.name === "EN_PROCESO" || (selectedOrder.status.name === "ENTREGADO" && !selectedOrder.signatureUrl)) ? (
                  <form
                    onSubmit={(e) => handleAddComment(e, selectedOrder.id)}
                    className="space-y-3 pt-2"
                  >
                    <div className="relative">
                      <textarea
                        name="commentContent"
                        rows={2}
                        placeholder="Escribe una nota interna sobre el progreso..."
                        className="w-full text-xs p-3 pr-12 bg-white border border-zinc-200 rounded-xl placeholder-zinc-400 focus:border-[#C9A84C] focus:outline-none transition-colors resize-none font-medium leading-relaxed"
                        required
                        disabled={isSubmittingComment}
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="absolute right-2.5 bottom-2.5 h-8.5 w-8.5 rounded-lg bg-[#C9A84C] text-[#0A0A0C] hover:bg-[#9A7A28] disabled:bg-zinc-100 disabled:text-zinc-400 flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 animate-colors"
                        title="Enviar nota"
                      >
                        {isSubmittingComment ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 text-[10px] text-zinc-400 font-semibold flex items-center gap-1.5 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-300"></span>
                    <span>El registro de comentarios está deshabilitado porque el servicio ha sido completamente entregado y firmado.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-150 flex justify-between items-center bg-zinc-50 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadPdf(selectedOrder.id)}
                disabled={downloadingPdfId === selectedOrder.id}
                className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-[#C9A84C] hover:bg-[#FBF5E6]/30 text-xs font-bold text-[#9A7A28] transition-colors cursor-pointer select-none disabled:opacity-50"
              >
                {downloadingPdfId === selectedOrder.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#C9A84C] border-t-transparent" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar Ficha PDF
              </button>
              <button
                type="button"
                onClick={handleCloseSelectedOrder}
                className="h-10 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition-colors cursor-pointer select-none"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
      {activeGalleryKey && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setActiveGalleryKey(null)}>
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative p-6 space-y-4 animate-[scaleIn_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            {/* Close Button with hover transition effect */}
            <button
              type="button"
              onClick={() => setActiveGalleryKey(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-sm select-none cursor-pointer font-bold"
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
              {(selectedOrder.checklist["_images_" + activeGalleryKey] as string[] || []).map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setZoomImage(imgUrl)}
                  className="aspect-square rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 relative hover:opacity-80 transition-all cursor-pointer focus:outline-none"
                >
                  <img src={imgUrl} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xs z-[70] flex items-center justify-center p-4 cursor-zoom-out animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="absolute -top-12 right-0 h-9 w-9 rounded-full bg-zinc-900/60 hover:bg-zinc-900 text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer border border-zinc-750"
              onClick={() => setZoomImage(null)}
            >
              ✕
            </button>
            <img
              src={zoomImage}
              alt="Visualización de Evidencia"
              className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl animate-[scaleIn_0.15s_ease-out]"
            />
          </div>
        </div>
      )}

      {/* DELIVERY MODAL (NUEVO) */}
      {deliveryOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div
            className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-[scaleIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-150 flex items-center justify-between bg-zinc-50 shrink-0">
              <div>
                <span className="font-mono font-bold text-xs text-[#9A7A28] uppercase tracking-wider block">
                  Confirmar Entrega de Vehículo
                </span>
                <h3 className="text-base font-extrabold text-zinc-900 mt-0.5">
                  Orden {deliveryOrder.code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeliveryOrder(null);
                  setDeliverySignatureData("");
                }}
                className="h-9 w-9 rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer select-none"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-450">Vehículo:</span>
                  <strong className="text-zinc-800">{deliveryOrder.car.brand.name} {deliveryOrder.car.model}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-450">Placa:</span>
                  <strong className="font-mono text-zinc-800">{deliveryOrder.car.plate}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-450">Cliente:</span>
                  <strong className="text-zinc-800">{deliveryOrder.client.name}</strong>
                </div>
              </div>

              {/* Canvas draw area */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Firma del Cliente (Obligatoria para entrega)
                  </span>
                  {deliverySignatureData && (
                    <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                      Dibujado ✓
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  El cliente debe firmar sobre el lienzo para dejar constancia de la entrega y conformidad del vehículo.
                </p>
                <div className="border border-zinc-250 rounded-xl bg-white overflow-hidden relative h-28 w-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
                  <canvas
                    id="delivery-sig-canvas"
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearDeliverySignature}
                    className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    Limpiar firma
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-150 bg-zinc-50 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeliveryOrder(null);
                  setDeliverySignatureData("");
                }}
                disabled={isSavingDelivery}
                className="h-10 px-4 rounded-lg border border-zinc-300 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition-colors cursor-pointer select-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleCompleteDelivery(deliveryOrder.id)}
                disabled={isSavingDelivery || !deliverySignatureData}
                className="h-10 px-5 rounded-lg bg-[#C9A84C] hover:bg-[#b0903c] text-xs font-bold text-[#0A0A0C] transition-colors cursor-pointer select-none disabled:opacity-50 shadow-sm shadow-[#C9A84C]/25 animate-colors"
              >
                {isSavingDelivery ? "Entregando..." : "Guardar y Entregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
