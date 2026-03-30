"use client";

import React, { useMemo, useState } from "react";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

export default function CotizarAirbnbPage() {
  const [propertyType, setPropertyType] = useState("Departamento");
  const [rooms, setRooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sameDayTurnover, setSameDayTurnover] = useState(false);

  const summary = useMemo(() => {
    return `${propertyType}, ${rooms} hab, ${bathrooms} baños${sameDayTurnover ? ", recambio en el dia" : ""}`;
  }, [propertyType, rooms, bathrooms, sameDayTurnover]);

  const whatsappHref = useMemo(() => {
    const msg = `Hola Elite Cleaning! Quiero cotizar Plan Airbnb. Detalles: ${summary}.`;
    const num = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
    return num
      ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }, [summary]);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-[920px] px-5 md:px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="text-xs tracking-[0.16em] uppercase text-slate-500">Cotizar Servicio</div>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: NAVY }}>
              ✨ Plan Airbnb
            </h1>
            <p className="mt-3 text-slate-600 max-w-[640px]">
              Servicio diseñado especialmente para propiedades en arriendo tipo Airbnb, enfocado en mantener altos estándares de limpieza, rapidez y presentación entre cada reserva.
            </p>
          </div>
          <a className="rounded-full px-4 py-2 text-sm font-medium border border-slate-200 bg-white" href="/">
            Volver
          </a>
        </div>

        {/* Descripción del plan */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(10,20,40,0.10)] mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: NAVY }}>¿Qué incluye?</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>✔ Limpieza completa de todos los espacios, con especial atención en cocina y baños</li>
            <li>✔ Orden general y cambio de ropa de cama (si aplica)</li>
            <li>✔ Revisión de detalles para una óptima presentación</li>
            <li>✔ Ventilación del lugar y control de olores</li>
            <li>✔ Preparación del espacio para recibir a los próximos huéspedes en perfectas condiciones</li>
          </ul>
          <p className="mt-4 text-sm text-slate-500 italic">
            Ideal para anfitriones que buscan un servicio confiable, constante y con resultados tipo hotel.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
          <h2 className="text-xl font-semibold" style={{ color: NAVY }}>Datos rapidos del servicio</h2>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de propiedad</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option>Departamento</option>
                <option>Casa</option>
                <option>Loft</option>
                <option>Estudio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recambio el mismo dia</label>
              <button
                type="button"
                onClick={() => setSameDayTurnover((prev) => !prev)}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold border transition-colors ${
                  sameDayTurnover
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-gray-50 text-gray-700 border-gray-300"
                }`}
              >
                {sameDayTurnover ? "Si, necesito recambio rapido" : "No, recambio normal"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Habitaciones</label>
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banos</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <div className="font-semibold" style={{ color: NAVY }}>Resumen</div>
            <p className="mt-1 text-slate-600">{summary}</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-center"
              style={{ background: "#25D366", color: "white" }}
            >
              Cotizar por WhatsApp
            </a>
            <a
              href="/cotizar/airbnb"
              className="rounded-2xl px-5 py-3 text-sm font-semibold text-center"
              style={{ background: YELLOW, color: "white" }}
            >
              Completar en esta pagina
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
