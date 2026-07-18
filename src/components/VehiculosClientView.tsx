"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createCarAdminAction, updateCarAdminAction } from "@/app/(authenticated)/vehiculos/actions";
import { useToast } from "@/components/ui/Toast";
import {
  Search,
  Plus,
  X,
  Phone,
  Mail,
  Car,
  User,
  Calendar,
  Edit,
  ChevronDown,
  Sparkles,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

interface CarData {
  id: number;
  plate: string;
  type: string;
  model: string;
  year: number;
  color: string;
  isActive: boolean;
  client: {
    id: number;
    name: string;
    phone: string;
    email: string | null;
  };
  brand: {
    id: number;
    name: string;
    logo: string | null;
  };
}

interface ClientItem {
  id: number;
  name: string;
  phone: string;
  email: string | null;
}

interface BrandItem {
  id: number;
  name: string;
  logo: string | null;
}

interface VehiculosClientViewProps {
  cars: CarData[];
  clients: ClientItem[];
  brands: BrandItem[];
}

export default function VehiculosClientView({
  cars,
  clients,
  brands,
}: VehiculosClientViewProps) {
  const { showToast } = useToast();

  // Refs for click outside to close dropdowns
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const editClientDropdownRef = useRef<HTMLDivElement>(null);
  const editBrandDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking/tapping outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBrandDropdownOpen(false);
      }
      if (
        editClientDropdownRef.current &&
        !editClientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditClientDropdownOpen(false);
      }
      if (
        editBrandDropdownRef.current &&
        !editBrandDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEditBrandDropdownOpen(false);
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
  const [statusFilter, setStatusFilter] = useState<"TODOS" | "ACTIVOS" | "INACTIVOS">("TODOS");
  const [brandFilter, setBrandFilter] = useState<string>("TODOS");
  
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);

  // Modals Visibility
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Create Car Form State
  const [carPlate, setCarPlate] = useState("");
  const [carYear, setCarYear] = useState("");
  const [carBrandId, setCarBrandId] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carColor, setCarColor] = useState("");
  const [carClientId, setCarClientId] = useState("");
  const [carType, setCarType] = useState("Automóvil");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [clientSearchText, setClientSearchText] = useState("");

  // Edit Car Form State
  const [editCarId, setEditCarId] = useState<number | null>(null);
  const [editCarPlate, setEditCarPlate] = useState("");
  const [editCarYear, setEditCarYear] = useState("");
  const [editCarBrandId, setEditCarBrandId] = useState("");
  const [editCarModel, setEditCarModel] = useState("");
  const [editCarColor, setEditCarColor] = useState("");
  const [editCarClientId, setEditCarClientId] = useState("");
  const [editCarType, setEditCarType] = useState("Automóvil");
  const [editCarIsActive, setEditCarIsActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditBrandDropdownOpen, setIsEditBrandDropdownOpen] = useState(false);
  const [isEditClientDropdownOpen, setIsEditClientDropdownOpen] = useState(false);
  const [editClientSearchText, setEditClientSearchText] = useState("");

  const [isPending, startCreateTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();

  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 38 }, (_, i) => currentYear + 1 - i);

  // Sync selected car if cars list updates
  useEffect(() => {
    if (selectedCar) {
      const updated = cars.find((c) => c.id === selectedCar.id);
      if (updated) {
        setSelectedCar(updated);
      }
    }
  }, [cars, selectedCar?.id]);

  const openCreateModal = () => {
    setCarPlate("");
    setCarYear("");
    setCarBrandId("");
    setCarModel("");
    setCarColor("");
    setCarClientId("");
    setCarType("Automóvil");
    setClientSearchText("");
    setCreateError(null);
    setIsBrandDropdownOpen(false);
    setIsClientDropdownOpen(false);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (car: CarData) => {
    setEditCarId(car.id);
    setEditCarPlate(car.plate);
    setEditCarYear(car.year.toString());
    setEditCarBrandId(car.brand.id.toString());
    setEditCarModel(car.model);
    setEditCarColor(car.color);
    setEditCarClientId(car.client.id.toString());
    setEditCarType(car.type || "Automóvil");
    setEditCarIsActive(car.isActive);
    setEditClientSearchText("");
    setEditError(null);
    setIsEditBrandDropdownOpen(false);
    setIsEditClientDropdownOpen(false);
    setIsEditModalOpen(true);
  };

  const handlePlateChange = (val: string, setter: (v: string) => void) => {
    setter(val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6));
  };

  // Filter clients dynamically by name or phone
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearchText.toLowerCase()) ||
      c.phone.includes(clientSearchText)
  );

  const filteredEditClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(editClientSearchText.toLowerCase()) ||
      c.phone.includes(editClientSearchText)
  );

  // Filter cars list
  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.brand.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "TODOS" ||
      (statusFilter === "ACTIVOS" && car.isActive) ||
      (statusFilter === "INACTIVOS" && !car.isActive);

    const matchesBrand =
      brandFilter === "TODOS" || car.brand.id.toString() === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      {/* TOPBAR */}
      <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
          <Car className="h-5.5 w-5.5 text-[#C9A84C]" />
          Vehículos
        </h2>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 px-4 py-2 text-xs font-bold text-[#0A0A0C] transition-all duration-150 shadow-[0_2px_8px_rgba(201,168,76,0.25)] cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Nuevo Vehículo
        </button>
      </header>

      {/* FILTER BAR AND GRID */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-zinc-50/50 p-4 rounded-xl border border-zinc-200/60 shadow-xs">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, dueño..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Status select filter */}
            <div className="flex bg-zinc-150 rounded-lg p-0.5 border border-zinc-200 select-none">
              {(["TODOS", "ACTIVOS", "INACTIVOS"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
                    statusFilter === status
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-950"
                  }`}
                >
                  {status === "TODOS" ? "Todos" : status === "ACTIVOS" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>

            {/* Brand select filter */}
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-white border border-zinc-200 text-xs font-semibold rounded-lg px-3 py-2 text-zinc-700 focus:border-[#C9A84C] focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todas las Marcas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vehicles list grid */}
        {filteredCars.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-zinc-400">
            No se encontraron vehículos.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                onClick={() => setSelectedCar(car)}
                className={`bg-white border hover:border-[#C9A84C] rounded-xl p-5 shadow-xs transition-all duration-150 cursor-pointer hover:shadow-md flex flex-col justify-between group relative ${
                  car.isActive ? "border-zinc-200" : "border-zinc-200 bg-zinc-50/50 opacity-75"
                }`}
              >
                <div>
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {car.brand.logo ? (
                        <img
                          src={car.brand.logo}
                          alt={car.brand.name}
                          className="h-8 w-8 rounded-lg object-contain border border-zinc-200 shrink-0 bg-white p-1"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-[#9A7A28] border border-zinc-200 shrink-0 font-bold text-xs select-none">
                          {car.brand.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-[10px] bg-zinc-150 border border-zinc-300 rounded px-1.5 py-0.2 tracking-wider text-zinc-800 select-none">
                          {car.plate}
                        </span>
                        <h3 className="font-bold text-zinc-900 group-hover:text-[#9A7A28] transition-colors truncate mt-1 text-sm">
                          {car.brand.name} {car.model}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded border select-none shrink-0 ${
                        car.isActive
                          ? "bg-green-50 text-green-700 border-green-200/60"
                          : "bg-red-50 text-red-700 border-red-200/60"
                      }`}
                    >
                      {car.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                    <div className="flex items-center justify-between text-xs gap-3">
                      <span className="text-zinc-400 font-medium">Dueño actual:</span>
                      <span className="font-bold text-zinc-700 truncate max-w-[150px] flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {car.client.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-550">
                      <span>Año: {car.year}</span>
                      <span>Color: {car.color}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-medium">Tipo: {car.type || "Automóvil"}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-205">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(car);
                      }}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 bg-zinc-50 border border-zinc-200 hover:text-[#9A7A28] hover:bg-[#FBF5E6]/60 hover:border-[#C9A84C]/35 cursor-pointer transition-colors"
                      title="Editar Vehículo"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCar(car);
                      }}
                      className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-500 bg-zinc-50 border border-zinc-200 hover:text-[#9A7A28] hover:bg-[#FBF5E6]/60 hover:border-[#C9A84C]/35 cursor-pointer transition-colors"
                      title="Ver Detalles"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BACKGROUND BLUR OVERLAY */}
      {(selectedCar || isCreateModalOpen || isEditModalOpen) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-45 transition-opacity duration-300"
          onClick={() => {
            setSelectedCar(null);
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {/* VEHICLE DETAILS DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl p-6 flex flex-col transform transition-transform duration-300 ease-out ${
          selectedCar ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedCar && (
          <>
            {/* Drawer Header */}
            <div className="flex flex-col items-center text-center gap-3 border-b border-zinc-200 pb-5 mb-6 relative">
              <button
                onClick={() => setSelectedCar(null)}
                className="absolute top-0 right-0 h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-150 transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="h-16 w-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 mt-3 p-2 shadow-xs">
                {selectedCar.brand.logo ? (
                  <img src={selectedCar.brand.logo} alt={selectedCar.brand.name} className="h-full w-full object-contain" />
                ) : (
                  <Car className="h-8 w-8 text-[#9A7A28]" />
                )}
              </div>

              <div>
                <span className="font-mono font-bold text-xs bg-zinc-100 border border-zinc-300 rounded px-2.5 py-0.5 tracking-wider text-zinc-800 shadow-2xs">
                  {selectedCar.plate}
                </span>
                <h3 className="font-bold text-zinc-900 leading-tight text-lg mt-3">
                  {selectedCar.brand.name} {selectedCar.model}
                </h3>
              </div>

              <button
                onClick={() => openEditModal(selectedCar)}
                className="h-8 px-4 rounded-lg border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50 hover:text-[#9A7A28] hover:border-[#C9A84C]/50 transition-all flex items-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar Vehículo
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Vehicle Specifications */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-zinc-150 pb-2">
                  <span className="text-zinc-400">Tipo de vehículo:</span>
                  <span className="font-semibold text-zinc-800">{selectedCar.type || "Automóvil"}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-150 pb-2">
                  <span className="text-zinc-400">Año de modelo:</span>
                  <span className="font-semibold text-zinc-800">{selectedCar.year}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-150 pb-2">
                  <span className="text-zinc-400">Color registrado:</span>
                  <span className="font-semibold text-zinc-800">{selectedCar.color}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-400">Estado en sistema:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedCar.isActive
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {selectedCar.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Owner Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5 select-none">
                  <User className="h-3.5 w-3.5" />
                  Dueño / Cliente Asociado
                </h4>
                <div className="bg-white border border-zinc-250 rounded-xl p-4 space-y-4">
                  <div>
                    <h5 className="font-bold text-zinc-850 text-sm leading-tight">{selectedCar.client.name}</h5>
                    {selectedCar.client.email && (
                      <span className="text-xs text-zinc-400 mt-1 block flex items-center gap-1 truncate">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedCar.client.email}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                    <span className="text-xs font-semibold text-zinc-650 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      {selectedCar.client.phone}
                    </span>

                    <a
                      href={`https://wa.me/57${selectedCar.client.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-105 font-bold px-3 py-1.5 rounded-lg border border-green-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE VEHICLE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both] flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
            <h3 className="font-bold text-zinc-950 text-sm flex items-center gap-1.5">
              <Car className="h-4.5 w-4.5 text-[#C9A84C]" />
              Nuevo Vehículo
            </h3>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/55 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!carClientId) {
                setCreateError("Debe seleccionar un cliente (dueño).");
                return;
              }
              if (carPlate.length < 5 || carPlate.length > 6) {
                setCreateError("La placa debe contener entre 5 y 6 caracteres alfanuméricos.");
                return;
              }
              if (!carYear) {
                setCreateError("Debe seleccionar el año de modelo.");
                return;
              }
              if (!carBrandId) {
                setCreateError("Debe seleccionar una marca.");
                return;
              }
              if (!carModel.trim()) {
                setCreateError("El modelo es obligatorio.");
                return;
              }
              if (!carColor.trim()) {
                setCreateError("El color es obligatorio.");
                return;
              }

              setCreateError(null);
              const formData = new FormData();
              formData.append("clientId", carClientId);
              formData.append("plate", carPlate);
              formData.append("year", carYear);
              formData.append("brandId", carBrandId);
              formData.append("model", carModel);
              formData.append("color", carColor);
              formData.append("type", carType);

              startCreateTransition(async () => {
                const res = await createCarAdminAction(null, formData);
                if (res.success) {
                  showToast("Vehículo registrado con éxito", "success");
                  setIsCreateModalOpen(false);
                } else if (res.error) {
                  setCreateError(res.error);
                  showToast(res.error, "error");
                }
              });
            }}
            className="p-5 space-y-4 overflow-y-auto flex-1"
          >
            {/* Custom Client Selector with Search */}
            <div className="space-y-1 relative" ref={clientDropdownRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Cliente Asociado (Dueño) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsClientDropdownOpen(!isClientDropdownOpen);
                  setCreateError(null);
                }}
                className={`w-full h-10 px-3 bg-zinc-50 border rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer ${
                  isClientDropdownOpen
                    ? "border-[#C9A84C] bg-white ring-1 ring-[#C9A84C]/50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span className="truncate">
                  {carClientId
                    ? clients.find((c) => c.id.toString() === carClientId)?.name || "Seleccionar Cliente..."
                    : "Seleccionar Cliente..."}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
              </button>

              {isClientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg text-sm text-zinc-700 z-40 animate-[fadeIn_0.15s_ease-out]">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o celular..."
                    value={clientSearchText}
                    onChange={(e) => setClientSearchText(e.target.value)}
                    className="w-full px-2.5 py-1.5 mb-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs focus:outline-none focus:border-[#C9A84C]"
                  />
                  <div className="space-y-0.5">
                    {filteredClients.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 p-2 text-center">No se encontraron clientes.</p>
                    ) : (
                      filteredClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setCarClientId(c.id.toString());
                            setIsClientDropdownOpen(false);
                          }}
                          className={`py-2 px-2.5 hover:bg-zinc-50 font-semibold cursor-pointer rounded-md transition-colors flex items-center justify-between ${
                            carClientId === c.id.toString() ? "text-[#9A7A28] bg-[#FBF5E6]/40" : "text-zinc-700"
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] text-zinc-400 font-medium">{c.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Type buttons */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Tipo de Vehículo *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCarType("Automóvil")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center justify-center font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                    carType === "Automóvil"
                      ? "border-[#C9A84C] bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  Automóvil
                </button>
                <button
                  type="button"
                  onClick={() => setCarType("Motocicleta")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center justify-center font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                    carType === "Motocicleta"
                      ? "border-[#C9A84C] bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  Motocicleta
                </button>
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Placa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="AAA000"
                  value={carPlate}
                  onChange={(e) => handlePlateChange(e.target.value, setCarPlate)}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 font-mono font-bold uppercase tracking-wider placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Año *
                </label>
                <button
                  type="button"
                  onClick={() => setIsBrandDropdownOpen(false) /* Close other */}
                  className="w-full h-10 px-3 bg-zinc-50 border rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer"
                  onClickCapture={() => {
                    const selector = document.getElementById("createYearSelect");
                    if (selector) (selector as any).showPicker?.() || selector.focus();
                  }}
                >
                  <span>{carYear || "Seleccionar..."}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>
                <select
                  id="createYearSelect"
                  value={carYear}
                  onChange={(e) => setCarYear(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                >
                  <option value="">Seleccionar...</option>
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Brand native select overlay */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Marca *
                </label>
                <button
                  type="button"
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer"
                  onClickCapture={() => {
                    const selector = document.getElementById("createBrandSelect");
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
                  id="createBrandSelect"
                  value={carBrandId}
                  onChange={(e) => {
                    setCarBrandId(e.target.value);
                    setCreateError(null);
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Swift"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Color *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Gris Platino"
                value={carColor}
                onChange={(e) => setCarColor(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {createError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 active:scale-98 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 transition-all rounded-lg text-xs font-bold text-[#0A0A0C] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {isPending ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0A0A0C] border-t-transparent" />
                ) : (
                  "Guardar Vehículo"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {isEditModalOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl z-50 w-full max-w-md border border-zinc-200 overflow-hidden animate-[scaleIn_0.2s_ease-out_both] flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50 shrink-0">
            <h3 className="font-bold text-zinc-950 text-sm flex items-center gap-1.5">
              <Edit className="h-4.5 w-4.5 text-[#C9A84C]" />
              Editar Vehículo
            </h3>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-650 hover:bg-zinc-200/55 transition-all"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editCarId) return;
              if (!editCarClientId) {
                setEditError("Debe seleccionar un cliente (dueño).");
                return;
              }
              if (editCarPlate.length < 5 || editCarPlate.length > 6) {
                setEditError("La placa debe contener entre 5 y 6 caracteres alfanuméricos.");
                return;
              }
              if (!editCarYear) {
                setEditError("Debe seleccionar el año de modelo.");
                return;
              }
              if (!editCarBrandId) {
                setEditError("Debe seleccionar una marca.");
                return;
              }
              if (!editCarModel.trim()) {
                setEditError("El modelo es obligatorio.");
                return;
              }
              if (!editCarColor.trim()) {
                setEditError("El color es obligatorio.");
                return;
              }

              setEditError(null);
              const formData = new FormData();
              formData.append("id", editCarId.toString());
              formData.append("clientId", editCarClientId);
              formData.append("plate", editCarPlate);
              formData.append("year", editCarYear);
              formData.append("brandId", editCarBrandId);
              formData.append("model", editCarModel);
              formData.append("color", editCarColor);
              formData.append("type", editCarType);
              formData.append("isActive", editCarIsActive ? "true" : "false");

              startEditTransition(async () => {
                const res = await updateCarAdminAction(null, formData);
                if (res.success) {
                  showToast("Vehículo actualizado con éxito", "success");
                  setIsEditModalOpen(false);
                } else if (res.error) {
                  setEditError(res.error);
                  showToast(res.error, "error");
                }
              });
            }}
            className="p-5 space-y-4 overflow-y-auto flex-1"
          >
            {/* Custom Client Selector for Edit */}
            <div className="space-y-1 relative" ref={editClientDropdownRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Cliente Asociado (Dueño) *
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsEditClientDropdownOpen(!isEditClientDropdownOpen);
                  setEditError(null);
                }}
                className={`w-full h-10 px-3 bg-zinc-50 border rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer ${
                  isEditClientDropdownOpen
                    ? "border-[#C9A84C] bg-white ring-1 ring-[#C9A84C]/50"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span className="truncate">
                  {editCarClientId
                    ? clients.find((c) => c.id.toString() === editCarClientId)?.name || "Seleccionar Cliente..."
                    : "Seleccionar Cliente..."}
                </span>
                <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
              </button>

              {isEditClientDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-2 shadow-lg text-sm text-zinc-705 z-40 animate-[fadeIn_0.15s_ease-out]">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o celular..."
                    value={editClientSearchText}
                    onChange={(e) => setEditClientSearchText(e.target.value)}
                    className="w-full px-2.5 py-1.5 mb-2 bg-zinc-50 border border-zinc-200 rounded-md text-xs focus:outline-none focus:border-[#C9A84C]"
                  />
                  <div className="space-y-0.5">
                    {filteredEditClients.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 p-2 text-center">No se encontraron clientes.</p>
                    ) : (
                      filteredEditClients.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setEditCarClientId(c.id.toString());
                            setIsEditClientDropdownOpen(false);
                          }}
                          className={`py-2 px-2.5 hover:bg-zinc-50 font-semibold cursor-pointer rounded-md transition-colors flex items-center justify-between ${
                            editCarClientId === c.id.toString() ? "text-[#9A7A28] bg-[#FBF5E6]/40" : "text-zinc-700"
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] text-zinc-400 font-medium">{c.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Type buttons */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Tipo de Vehículo *
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditCarType("Automóvil")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center justify-center font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                    editCarType === "Automóvil"
                      ? "border-[#C9A84C] bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  Automóvil
                </button>
                <button
                  type="button"
                  onClick={() => setEditCarType("Motocicleta")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center justify-center font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                    editCarType === "Motocicleta"
                      ? "border-[#C9A84C] bg-[#FBF5E6]/60 text-[#9A7A28] shadow-xs"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  Motocicleta
                </button>
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Placa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="AAA000"
                  value={editCarPlate}
                  onChange={(e) => handlePlateChange(e.target.value, setEditCarPlate)}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 font-mono font-bold uppercase tracking-wider placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Año *
                </label>
                <button
                  type="button"
                  className="w-full h-10 px-3 bg-zinc-50 border rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer"
                  onClickCapture={() => {
                    const selector = document.getElementById("editYearSelect");
                    if (selector) (selector as any).showPicker?.() || selector.focus();
                  }}
                >
                  <span>{editCarYear || "Seleccionar..."}</span>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </button>
                <select
                  id="editYearSelect"
                  value={editCarYear}
                  onChange={(e) => setEditCarYear(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                >
                  <option value="">Seleccionar...</option>
                  {yearsList.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Brand native select overlay */}
              <div className="space-y-1 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Marca *
                </label>
                <button
                  type="button"
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 transition-all flex items-center justify-between cursor-pointer"
                  onClickCapture={() => {
                    const selector = document.getElementById("editBrandSelect");
                    if (selector) (selector as any).showPicker?.() || selector.focus();
                  }}
                >
                  <span className="truncate">
                    {editCarBrandId
                      ? brands.find((b) => b.id.toString() === editCarBrandId)?.name || "Seleccionar..."
                      : "Seleccionar..."}
                  </span>
                  <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                </button>
                <select
                  id="editBrandSelect"
                  value={editCarBrandId}
                  onChange={(e) => {
                    setEditCarBrandId(e.target.value);
                    setEditError(null);
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

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Modelo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Swift"
                  value={editCarModel}
                  onChange={(e) => setEditCarModel(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Color *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gris Platino"
                  value={editCarColor}
                  onChange={(e) => setEditCarColor(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-805 placeholder-zinc-400 focus:border-[#C9A84C] focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Status active/inactive toggler */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Estado *
                </label>
                <button
                  type="button"
                  onClick={() => setEditCarIsActive(!editCarIsActive)}
                  className={`w-full h-10 border rounded-lg flex items-center justify-center font-bold text-xs uppercase transition-all select-none cursor-pointer ${
                    editCarIsActive
                      ? "border-green-200 bg-green-50 text-green-700 shadow-xs"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {editCarIsActive ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>

            {editError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600 flex items-center justify-center gap-1.5 animate-[fadeIn_0.15s_ease-out]">
                <XCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 active:scale-98 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isEditPending}
                className="px-4 py-2 bg-[#C9A84C] hover:bg-[#b0903c] active:scale-98 transition-all rounded-lg text-xs font-bold text-[#0A0A0C] disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
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
    </div>
  );
}
