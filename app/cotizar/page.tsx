"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { addToCart, formatCLP, getServiceSlotStatuses, isServiceSlotUnavailable, type ServiceShift, type ServiceSlotStatusMap } from "@/lib/store";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

type ServiceType = "casa" | "oficina" | "adulto-joven";
type CleaningType = "basica" | "profunda";

const youngAdultPricing = {
  basica: 40000,
  profunda: 45000,
};

const pricing = {
  basica: {
    "1-1": 50000,
    "2-2": 55000,
    "3-2": 60000,
    "4-3": 65000,
  },
  profunda: {
    "1-1": 60000,
    "2-2": 65000,
    "3-2": 70000,
    "4-3": 80000,
  },
};

const extras = {
  fullCocina: 10000,
  fullBano: 10000,
  fullMascota: 10000,
};

const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function formatServiceDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function findNextAvailableSlot(slotStatuses: ServiceSlotStatusMap, fromDate = new Date()) {
  const candidate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());

  for (let offset = 0; offset < 366; offset += 1) {
    const current = new Date(candidate);
    current.setDate(candidate.getDate() + offset);
    const dateKey = toDateKey(current);
    const dayStatus = slotStatuses[dateKey] ?? {};
    if (!dayStatus.AM) return { dateKey, shift: "AM" as ServiceShift };
    if (!dayStatus.PM) return { dateKey, shift: "PM" as ServiceShift };
  }

  return null;
}

export default function CotizarPage() {
  const { push } = useToast();
  const [serviceType, setServiceType] = useState<ServiceType>("casa");
  const [isYoungAdultMode, setIsYoungAdultMode] = useState(false);
  const [cleaningType, setCleaningType] = useState<CleaningType>("basica");
  const [hasPickedCleaningType, setHasPickedCleaningType] = useState(false);
  const [dormitorios, setDormitorios] = useState(1);
  const [banos, setBanos] = useState(1);
  const [metros, setMetros] = useState(40);
  const [selectedExtras, setSelectedExtras] = useState({
    fullCocina: false,
    fullBano: false,
    fullMascota: false,
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState<ServiceShift | null>(null);
  const [slotPickerDate, setSlotPickerDate] = useState<string | null>(null);
  const [slotStatuses, setSlotStatuses] = useState<ServiceSlotStatusMap>({});
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [showDetailModal, setShowDetailModal] = useState(false);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  useEffect(() => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes("/cotizar/adulto-joven")) {
      setIsYoungAdultMode(true);
      setServiceType("adulto-joven");
      return;
    }

    setIsYoungAdultMode(false);
    const servicioParam = new URLSearchParams(window.location.search).get("servicio");
    setServiceType(
      servicioParam === "oficina" ? "oficina" : "casa"
    );
  }, []);

  useEffect(() => {
    const refreshSlotStatuses = () => {
      setSlotStatuses(getServiceSlotStatuses());
    };

    refreshSlotStatuses();
    window.addEventListener("focus", refreshSlotStatuses);
    window.addEventListener("storage", refreshSlotStatuses);
    window.addEventListener("ec:service-slots-updated", refreshSlotStatuses as EventListener);

    return () => {
      window.removeEventListener("focus", refreshSlotStatuses);
      window.removeEventListener("storage", refreshSlotStatuses);
      window.removeEventListener("ec:service-slots-updated", refreshSlotStatuses as EventListener);
    };
  }, []);

  useEffect(() => {
    const selectedUnavailable = !!(selectedDate && selectedShift && isServiceSlotUnavailable(selectedDate, selectedShift));
    if (!selectedDate || !selectedShift || selectedDate < todayKey || selectedUnavailable) {
      const nextAvailable = findNextAvailableSlot(slotStatuses);
      setSelectedDate(nextAvailable?.dateKey ?? "");
      setSelectedShift(nextAvailable?.shift ?? null);
      if (nextAvailable) {
        const nextDate = parseDateKey(nextAvailable.dateKey);
        setCalendarMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
      }
    }
  }, [slotStatuses, selectedDate, selectedShift, todayKey]);

  useEffect(() => {
    if (serviceType !== "casa") {
      setSelectedExtras({
        fullCocina: false,
        fullBano: false,
        fullMascota: false,
      });
      setCleaningType("basica");
      setHasPickedCleaningType(false);
    }
  }, [serviceType]);

  const basePrice = useMemo(() => {
    if (serviceType === "oficina") {
      const m = Math.max(40, metros);
      const base = m * 1000;
      return cleaningType === "profunda" ? Math.round(base * 1.2) : base;
    }
    if (serviceType === "adulto-joven") {
      return youngAdultPricing[cleaningType];
    }
    const key = `${dormitorios}-${banos}` as keyof typeof pricing.basica;
    return pricing[cleaningType][key] || 0;
  }, [serviceType, cleaningType, dormitorios, banos, metros]);

  const extrasTotal = useMemo(() => {
    if (serviceType !== "casa") return 0;
    return Object.entries(selectedExtras).reduce((total, [key, selected]) => {
      if (selected) {
        return total + extras[key as keyof typeof extras];
      }
      return total;
    }, 0);
  }, [selectedExtras, serviceType]);

  const totalPrice = basePrice + extrasTotal;
  const hasExtras = serviceType === "casa" && Object.values(selectedExtras).some(Boolean);
  const selectedDateLabel = selectedDate ? formatServiceDate(selectedDate) : "Sin fecha seleccionada";
  const selectedDateTimeLabel = selectedDate && selectedShift
    ? `${selectedDateLabel} (${selectedShift})`
    : selectedDateLabel;

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
    const days: Array<{ dateKey: string; dayNumber: number } | null> = [];

    for (let index = 0; index < leadingEmptyDays; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      days.push({ dateKey: toDateKey(date), dayNumber: day });
    }

    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [calendarMonth]);

  const canGoToPreviousMonth = useMemo(() => {
    const currentMonth = new Date();
    const minimumMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    return calendarMonth > minimumMonth;
  }, [calendarMonth]);

  const handleExtraChange = (extra: keyof typeof selectedExtras) => {
    setSelectedExtras(prev => ({
      ...prev,
      [extra]: !prev[extra]
    }));
  };

  const addToCartHandler = () => {
    if (!selectedDate) {
      push({
        title: "Selecciona una fecha",
        message: "Elige una fecha disponible antes de agregar el servicio al carrito.",
        variant: "info"
      });
      return;
    }

    if (!selectedShift) {
      push({
        title: "Selecciona AM o PM",
        message: "Debes elegir un bloque horario antes de agregar el servicio.",
        variant: "info"
      });
      return;
    }

    if (isServiceSlotUnavailable(selectedDate, selectedShift)) {
      setSlotStatuses(getServiceSlotStatuses());
      push({
        title: "Bloque no disponible",
        message: `El bloque ${selectedShift} de esa fecha ya está reservado u ocupado. Elige otro horario.`,
        variant: "error"
      });
      return;
    }

    const caracteristicas = serviceType === "oficina"
      ? `${metros} m²`
      : serviceType === "adulto-joven"
      ? "1 dorm, 1 baño"
      : `${dormitorios} dorm, ${banos} baños`;
    const tipoLabel = serviceType === "casa" ? "Casa/Departamento" : serviceType === "oficina" ? "Oficina" : "Plan Smart Living";
    const serviceName = `${tipoLabel} - ${cleaningType === "basica" ? "Plan Esencial" : "Plan Full Premium"} (${caracteristicas})`;
    const extrasList = Object.entries(selectedExtras)
      .filter(([_, selected]) => selected)
      .map(([key]) => {
        switch (key) {
          case "fullCocina": return "Full Cocina";
          case "fullBano": return "Full Baño";
          case "fullMascota": return "Full Mascota";
          default: return "";
        }
      });

    const fullName = serviceType === "casa" && extrasList.length > 0
      ? `${serviceName} + ${extrasList.join(", ")}`
      : serviceName;

    addToCart({
      type: "service",
      name: fullName,
      price: totalPrice,
      qty: 1,
      meta: {
        serviceType,
        cleaningType,
        dormitorios,
        banos,
        metros,
        serviceDate: selectedDate,
        serviceShift: selectedShift,
        extras: selectedExtras,
      }
    });

    push({
      title: "Servicio agregado al carrito",
      message: `${fullName} · ${selectedDateTimeLabel} · ${formatCLP(totalPrice)}`,
      variant: "success"
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs tracking-[0.16em] uppercase text-slate-500">Cotizar Servicio</div>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: NAVY }}>
              Calcula el precio de tu limpieza
            </h1>
          </div>
          <a className="rounded-full px-4 py-2 text-sm font-medium border border-slate-200 bg-white" href="/">
            Volver
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Formulario */}
          <div className="space-y-6">
            {/* Tipo de servicio */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
              <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Tipo de Servicio</h3>
              {isYoungAdultMode ? (
                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                  Plan Smart Living
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "casa", label: "Casa/Departamento" },
                    { value: "oficina", label: "Oficina" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        serviceType === option.value
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => setServiceType(option.value as ServiceType)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {serviceType === "casa" && (
              <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
                <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Tipo de Limpieza</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "basica", label: "Plan Esencial" },
                    { value: "profunda", label: "Plan Full Premium" }
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                        cleaningType === option.value
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      onClick={() => {
                        setCleaningType(option.value as CleaningType);
                        setHasPickedCleaningType(true);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  {hasPickedCleaningType && (
                    cleaningType === "basica" ? (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
                        <div className="font-semibold" style={{ color: NAVY }}>✨ Plan Esencial</div>
                        <p className="mt-1 text-xs italic text-blue-600 mb-2">Perfecto para mantención semanal</p>
                        <ul className="mt-1 text-gray-600 leading-relaxed space-y-1">
                          <li>✔ Limpieza general de superficies</li>
                          <li>✔ Barrido y trapeado de pisos</li>
                          <li>✔ Limpieza de baño</li>
                          <li>✔ Limpieza exterior de cocina</li>
                          <li>✔ Retiro de basura</li>
                        </ul>
                      </div>
                    ) : cleaningType === "profunda" ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
                        <div className="font-semibold" style={{ color: NAVY }}>🔥 Plan Full Premium</div>
                        <p className="mt-1 text-xs italic text-red-500 mb-2">Tu hogar como nuevo</p>
                        <ul className="mt-1 text-gray-600 leading-relaxed space-y-1">
                          <li>✔ Desengrase de cocina</li>
                          <li>✔ Limpieza interior de horno</li>
                          <li>✔ Tratamiento de sarro</li>
                          <li>✔ Limpieza detallada de baño</li>
                          <li>✔ Superficies y rincones a fondo</li>
                        </ul>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* Características */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
              <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Características</h3>

              {serviceType === "adulto-joven" ? (
                <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-semibold mb-1">Plan Smart Living — primeros departamentos</p>
                  <p className="text-blue-700">Incluye limpieza de 1 dormitorio y 1 baño. Ideal para estudiantes o quienes viven solos. Tiempo estimado aproximado: 2 horas. Puedes agregar extras abajo.</p>
                </div>
              ) : serviceType === "oficina" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metros cuadrados <span className="text-gray-400 font-normal">(mínimo 40 m²)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMetros((m) => Math.max(40, m - 10))}
                      className="w-11 h-11 rounded-2xl border border-gray-300 text-sm font-bold hover:bg-gray-100 transition-colors flex items-center justify-center"
                      title="-10 m²"
                    >−10</button>
                    <button
                      onClick={() => setMetros((m) => Math.max(40, m - 1))}
                      className="w-11 h-11 rounded-2xl border border-gray-300 text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                      title="-1 m²"
                    >−</button>
                    <div className="flex-1 rounded-2xl border border-gray-300 px-4 py-3 text-center text-sm font-semibold" style={{ color: NAVY }}>
                      {metros} m²
                    </div>
                    <button
                      onClick={() => setMetros((m) => m + 1)}
                      className="w-11 h-11 rounded-2xl border border-gray-300 text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
                      title="+1 m²"
                    >+</button>
                    <button
                      onClick={() => setMetros((m) => m + 10)}
                      className="w-11 h-11 rounded-2xl border border-gray-300 text-sm font-bold hover:bg-gray-100 transition-colors flex items-center justify-center"
                      title="+10 m²"
                    >+10</button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">$1.000 por m² · usa −/+ de 1 en 1 o −10/+10 para saltar de 10 en 10</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de dormitorios
                    </label>
                    <select
                      value={dormitorios}
                      onChange={(e) => setDormitorios(Number(e.target.value))}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {[1, 2, 3, 4].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de baños
                    </label>
                    <select
                      value={banos}
                      onChange={(e) => setBanos(Number(e.target.value))}
                      className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      {[1, 2, 3].map((num) => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {serviceType === "casa" && (
              <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
                <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Servicios Adicionales</h3>

                <div className="space-y-3">
                  {[
                    { key: "fullCocina", label: "Full Cocina", price: extras.fullCocina },
                    { key: "fullBano", label: "Full Baño", price: extras.fullBano },
                    { key: "fullMascota", label: "Full Mascota", price: extras.fullMascota }
                  ].map((extra) => (
                    <label key={extra.key} className="flex items-center justify-between p-3 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExtras[extra.key as keyof typeof selectedExtras]}
                          onChange={() => handleExtraChange(extra.key as keyof typeof selectedExtras)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{extra.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">+ {formatCLP(extra.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl p-4 md:p-5 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: NAVY }}>Agenda tu fecha</h3>
                  <p className="mt-1 text-xs md:text-sm text-gray-500">Los bloques AM/PM reservados u ocupados se bloquean automáticamente.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right sm:max-w-[170px]">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Fecha elegida</div>
                  <div className="mt-1 text-xs md:text-sm font-semibold leading-snug" style={{ color: NAVY }}>{selectedDate ? selectedDateLabel : "Selecciona un día"}</div>
                  <div className="mt-1 text-[11px] font-semibold" style={{ color: NAVY }}>{selectedShift ? `Bloque ${selectedShift}` : "Selecciona AM o PM"}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => canGoToPreviousMonth && setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  disabled={!canGoToPreviousMonth}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ color: NAVY }}
                >
                  Anterior
                </button>
                <div className="text-xs md:text-sm font-semibold capitalize" style={{ color: NAVY }}>
                  {calendarMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold"
                  style={{ color: NAVY }}
                >
                  Siguiente
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="py-1.5">{label}</div>
                ))}
              </div>

              <div className="mt-1.5 grid grid-cols-7 gap-1.5">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="h-10 md:h-11 rounded-xl bg-slate-50/70" />;
                  }

                  const isPastDate = day.dateKey < todayKey;
                  const dayStatus = slotStatuses[day.dateKey] ?? {};
                  const isAMUnavailable = !!dayStatus.AM;
                  const isPMUnavailable = !!dayStatus.PM;
                  const isFullyUnavailable = isAMUnavailable && isPMUnavailable;
                  const isPartiallyUnavailable = !isFullyUnavailable && (isAMUnavailable || isPMUnavailable);
                  const isSelected = selectedDate === day.dateKey;
                  const isDisabled = isPastDate || isFullyUnavailable;

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSlotPickerDate(day.dateKey)}
                      className={`h-10 md:h-11 rounded-xl border text-xs md:text-sm font-semibold transition-all ${
                        isSelected
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg"
                          : isFullyUnavailable
                          ? "border-red-100 bg-red-50 text-red-300"
                          : isPartiallyUnavailable
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : isPastDate
                          ? "border-slate-100 bg-slate-50 text-slate-300"
                          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-[1px] hover:border-blue-300"
                      }`}
                    >
                      {day.dayNumber}
                    </button>
                  );
                })}
              </div>

              {slotPickerDate && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs text-slate-500">Selecciona bloque para {formatServiceDate(slotPickerDate)}:</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["AM", "PM"] as ServiceShift[]).map((shift) => {
                      const status = slotStatuses[slotPickerDate]?.[shift];
                      const unavailable = !!status;
                      return (
                        <button
                          key={shift}
                          type="button"
                          disabled={unavailable}
                          onClick={() => {
                            setSelectedDate(slotPickerDate);
                            setSelectedShift(shift);
                            setSlotPickerDate(null);
                          }}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                            unavailable
                              ? "border-red-100 bg-red-50 text-red-300 cursor-not-allowed"
                              : selectedDate === slotPickerDate && selectedShift === shift
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {shift}{unavailable ? ` · ${status}` : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-300" />Disponible</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" />Seleccionado</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />Parcial</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-200" />Ocupado</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] h-fit">
              <h3 className="text-lg font-semibold mb-6" style={{ color: NAVY }}>Resumen de Cotización</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium text-right max-w-[220px]">{selectedDate ? selectedDateLabel : "Selecciona una fecha"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bloque:</span>
                  <span className="font-medium">{selectedShift ?? "Selecciona AM o PM"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{serviceType === "casa" ? "Casa/Departamento" : serviceType === "oficina" ? "Oficina" : "Plan Smart Living"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Limpieza:</span>
                  <span className="font-medium">{cleaningType === "basica" ? "Plan Esencial" : "Plan Full Premium"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Características:</span>
                  <span className="font-medium">
                    {serviceType === "oficina" ? `${metros} m²` : serviceType === "adulto-joven" ? "1 dorm, 1 baño" : `${dormitorios} dorm, ${banos} baños`}
                  </span>
                </div>

                {Object.entries(selectedExtras).some(([, v]) => v) && (
                  <div className="flex justify-between items-start border-t border-gray-100 pt-4">
                    <span className="text-gray-600">Extras:</span>
                    <div className="text-right text-sm font-medium space-y-1">
                      {selectedExtras.fullCocina && <div>Full Cocina</div>}
                      {selectedExtras.fullBano && <div>Full Baño</div>}
                      {selectedExtras.fullMascota && <div>Full Mascota</div>}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  if (!selectedDate || !selectedShift) {
                    push({
                      title: "Selecciona fecha y bloque",
                      message: "Elige un día disponible y un bloque AM o PM antes de continuar con la cotización.",
                      variant: "info"
                    });
                    return;
                  }
                  setShowDetailModal(true);
                }}
                className="w-full mt-6 rounded-2xl px-4 py-4 text-sm font-semibold transition-transform duration-500 ease-in-out hover:-translate-y-[0.5px] active:scale-[0.99]"
                style={{ background: YELLOW, color: "white" }}
              >
                Cotizar
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                Te contactaremos para confirmar disponibilidad y precio final.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal detalle + precio */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4" style={{ color: NAVY }}>Detalle de tu servicio</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-semibold text-right max-w-[220px]" style={{ color: NAVY }}>{selectedDateLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bloque:</span>
                <span className="font-semibold" style={{ color: NAVY }}>{selectedShift ?? "Sin bloque"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-semibold" style={{ color: NAVY }}>{serviceType === "casa" ? "Casa/Departamento" : serviceType === "oficina" ? "Oficina" : "Plan Smart Living"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Limpieza:</span>
                <span className="font-semibold" style={{ color: NAVY }}>{cleaningType === "basica" ? "Plan Esencial" : "Plan Full Premium"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Características:</span>
                <span className="font-semibold" style={{ color: NAVY }}>
                  {serviceType === "oficina" ? `${metros} m²` : serviceType === "adulto-joven" ? "1 dorm, 1 baño" : `${dormitorios} dorm, ${banos} baños`}
                </span>
              </div>

              {hasExtras && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-gray-600 mb-1">Extras:</div>
                  <div className="font-semibold space-y-1" style={{ color: NAVY }}>
                    {selectedExtras.fullCocina && <div>- Full Cocina</div>}
                    {selectedExtras.fullBano && <div>- Full Baño</div>}
                    {selectedExtras.fullMascota && <div>- Full Mascota</div>}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-300 flex justify-between items-center text-lg">
                <span className="font-semibold" style={{ color: NAVY }}>Precio estimado:</span>
                <span className="font-bold" style={{ color: NAVY }}>{formatCLP(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                addToCartHandler();
                setShowDetailModal(false);
              }}
              className="w-full mt-6 rounded-2xl px-4 py-4 text-sm font-semibold transition-transform duration-500 ease-in-out hover:-translate-y-[0.5px] active:scale-[0.99]"
              style={{ background: YELLOW, color: "white" }}
            >
              Agregar al carrito
            </button>

            <button
              onClick={() => setShowDetailModal(false)}
              className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}