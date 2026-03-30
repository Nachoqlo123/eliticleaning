"use client";

import React, { useEffect, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useMounted } from "@/components/hooks/useMounted";
import {
  getSessionUser,
  getOrders,
  getServiceSlotStatus,
  updateOrderStatus,
  setServiceSlotStatus,
  getUserById,
  getCatalogProducts,
  saveCatalogProduct,
  deleteCatalogProduct,
  getCatalogServices,
  saveCatalogService,
  deleteCatalogService,
  getGiftCards,
  createGiftCard,
  disableGiftCard,
  getGiftAmounts,
  setGiftAmounts,
  formatCLP,
  type ServiceShift,
  type CatalogProduct,
  type CatalogService,
} from "@/lib/store";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

type Tab = "orders" | "products" | "services" | "giftcards";

/* ──────────────────────────────────────────
   Shared UI helpers
────────────────────────────────────────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-semibold" style={{ color: NAVY }}>{children}</h2>;
}

function Btn({
  children,
  onClick,
  variant = "primary",
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "yellow";
  type?: "button" | "submit";
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: "bg-[#0B1C3A] text-white hover:opacity-90",
    secondary: "border border-gray-200 text-gray-700 hover:bg-gray-50",
    danger: "border border-red-100 text-red-500 hover:bg-red-50",
    yellow: "text-white hover:opacity-90",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${styles[variant]} ${className}`}
      style={variant === "yellow" ? { background: YELLOW } : undefined}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

/* ──────────────────────────────────────────
   Image picker (upload → base64 or URL)
────────────────────────────────────────── */
function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState(value.startsWith("data:") ? "" : value);

  return (
    <div className="space-y-3">
      {value && (
        <img
          src={value}
          alt="preview"
          className="h-24 w-40 rounded-xl object-cover border border-gray-200"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="rounded-xl border border-dashed border-gray-300 px-4 py-2 text-sm text-slate-500 hover:bg-gray-50 transition"
        >
          {value ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {value && (
          <button type="button" onClick={() => { onChange(""); setUrlDraft(""); }} className="text-xs text-red-400 hover:text-red-600">
            Quitar
          </button>
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 1_500_000) {
            alert("La imagen debe ser menor a 1.5 MB para guardarse como base64.");
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            onChange(ev.target?.result as string);
            setUrlDraft("");
          };
          reader.readAsDataURL(file);
        }}
      />
      <Field label="O pegar URL">
        <input
          type="text"
          value={urlDraft}
          onChange={(e) => {
            setUrlDraft(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="https://ejemplo.com/imagen.jpg"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

/* ──────────────────────────────────────────
   PRODUCTS TAB
────────────────────────────────────────── */
const BLANK_PRODUCT = (): CatalogProduct => ({
  id: `cp_${nanoid(8)}`,
  name: "",
  desc: "",
  price: 0,
  image: "",
  category: "General",
  badge: "",
  stock: 0,
  format: "Formato estándar",
  recommendedUse: "Uso general",
  surface: "Superficies múltiples",
});

function ProductsTab({ tick, bump }: { tick: number; bump: () => void }) {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);

  useEffect(() => { setItems(getCatalogProducts()); }, [tick]);

  const openNew = () => setEditing(BLANK_PRODUCT());
  const openEdit = (p: CatalogProduct) => setEditing({ ...p });
  const cancel = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) { alert("El nombre es requerido."); return; }
    if (editing.price <= 0) { alert("El precio debe ser mayor a 0."); return; }
    saveCatalogProduct(editing);
    setItems(getCatalogProducts());
    setEditing(null);
    bump();
  };

  const del = (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    deleteCatalogProduct(id);
    setItems(getCatalogProducts());
    bump();
  };

  const isNew = editing ? !items.find((x) => x.id === editing.id) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>Productos ({items.length})</SectionTitle>
        <Btn variant="yellow" onClick={openNew}>+ Nuevo producto</Btn>
      </div>

      {/* Form */}
      {editing && (
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] border-2 border-blue-100">
          <h3 className="text-base font-semibold mb-5" style={{ color: NAVY }}>
            {isNew ? "Nuevo producto" : "Editar producto"}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="Nombre *">
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className={inputCls}
                  placeholder="Nombre del producto"
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  value={editing.desc}
                  onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Descripción breve del producto"
                />
              </Field>
              <Field label="Categoría">
                <input
                  type="text"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className={inputCls}
                  placeholder="Ej: Cocina, Pisos, Vidrios"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Badge comercial">
                  <select
                    value={editing.badge}
                    onChange={(e) => setEditing({ ...editing, badge: e.target.value as CatalogProduct["badge"] })}
                    className={inputCls}
                  >
                    <option value="">Sin badge</option>
                    <option value="destacado">Destacado</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="mas-vendido">Más vendido</option>
                    <option value="recomendado">Recomendado</option>
                  </select>
                </Field>
                <Field label="Stock">
                  <input
                    type="number"
                    min={0}
                    value={editing.stock}
                    onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })}
                    className={inputCls}
                    placeholder="0"
                  />
                </Field>
              </div>
              <Field label="Formato">
                <input
                  type="text"
                  value={editing.format}
                  onChange={(e) => setEditing({ ...editing, format: e.target.value })}
                  className={inputCls}
                  placeholder="Ej: Bidón 5 litros"
                />
              </Field>
              <Field label="Uso recomendado">
                <input
                  type="text"
                  value={editing.recommendedUse}
                  onChange={(e) => setEditing({ ...editing, recommendedUse: e.target.value })}
                  className={inputCls}
                  placeholder="Ej: Limpieza frecuente"
                />
              </Field>
              <Field label="Superficie">
                <input
                  type="text"
                  value={editing.surface}
                  onChange={(e) => setEditing({ ...editing, surface: e.target.value })}
                  className={inputCls}
                  placeholder="Ej: Cerámica y porcelanato"
                />
              </Field>
              <Field label="Precio CLP *">
                <input
                  type="number"
                  min={1}
                  value={editing.price || ""}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className={inputCls}
                  placeholder="19990"
                />
              </Field>
            </div>
            <Field label="Imagen">
              <ImagePicker
                value={editing.image}
                onChange={(v) => setEditing({ ...editing, image: v })}
              />
            </Field>
          </div>
          <div className="flex gap-3 mt-6">
            <Btn onClick={save}>Guardar</Btn>
            <Btn variant="secondary" onClick={cancel}>Cancelar</Btn>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-3xl bg-white overflow-hidden shadow-[0_12px_40px_rgba(10,20,40,0.08)]">
            {p.image ? (
              <img src={p.image} alt={p.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sin imagen</div>
            )}
            <div className="p-5">
              <div className="font-semibold text-sm text-slate-900 line-clamp-2">{p.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{p.category}</div>
                {p.badge && <div className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">{p.badge}</div>}
              </div>
              <div className="text-xs text-slate-500 mt-1 line-clamp-2">{p.desc}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <span className="rounded-lg bg-slate-50 px-2 py-1">Stock: {p.stock}</span>
                <span className="rounded-lg bg-slate-50 px-2 py-1">Formato: {p.format}</span>
              </div>
              <div className="mt-2 font-bold text-sm" style={{ color: NAVY }}>{formatCLP(p.price)}</div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => del(p.id)}
                  className="rounded-xl border border-red-100 text-red-500 px-3 py-2 text-xs font-semibold hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-500">
          Aún no tienes productos cargados. Agrega el primero para activar la vitrina y la tienda filtrable.
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   SERVICES TAB
────────────────────────────────────────── */
const BLANK_SERVICE = (n: number): CatalogService => ({
  id: `cs_${nanoid(8)}`,
  key: `service_${nanoid(4)}`,
  n: String(n).padStart(2, "0"),
  title: "",
  sub: "",
  image: "",
  cotizarHref: "/cotizar",
  cta: "",
});

function ServicesTab({ tick, bump }: { tick: number; bump: () => void }) {
  const [items, setItems] = useState<CatalogService[]>([]);
  const [editing, setEditing] = useState<CatalogService | null>(null);

  useEffect(() => { setItems(getCatalogServices()); }, [tick]);

  const openNew = () => setEditing(BLANK_SERVICE(items.length + 1));
  const openEdit = (s: CatalogService) => setEditing({ ...s });
  const cancel = () => setEditing(null);

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim()) { alert("El título es requerido."); return; }
    saveCatalogService(editing);
    setItems(getCatalogServices());
    setEditing(null);
    bump();
  };

  const del = (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    deleteCatalogService(id);
    setItems(getCatalogServices());
    bump();
  };

  const isNew = editing ? !items.find((x) => x.id === editing.id) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle>Servicios ({items.length})</SectionTitle>
        <Btn variant="yellow" onClick={openNew}>+ Nuevo servicio</Btn>
      </div>

      {/* Form */}
      {editing && (
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] border-2 border-blue-100">
          <h3 className="text-base font-semibold mb-5" style={{ color: NAVY }}>
            {isNew ? "Nuevo servicio" : "Editar servicio"}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número (ej: 01)">
                  <input
                    type="text"
                    value={editing.n}
                    onChange={(e) => setEditing({ ...editing, n: e.target.value })}
                    className={inputCls}
                    placeholder="01"
                  />
                </Field>
                <Field label="Clave interna">
                  <input
                    type="text"
                    value={editing.key}
                    onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                    className={inputCls}
                    placeholder="home"
                  />
                </Field>
              </div>
              <Field label="Título *">
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className={inputCls}
                  placeholder="Limpieza Hogar"
                />
              </Field>
              <Field label="Subtítulo">
                <input
                  type="text"
                  value={editing.sub}
                  onChange={(e) => setEditing({ ...editing, sub: e.target.value })}
                  className={inputCls}
                  placeholder="casa / departamento, mantenimiento o profunda"
                />
              </Field>
              <Field label="Link al cotizador">
                <input
                  type="text"
                  value={editing.cotizarHref}
                  onChange={(e) => setEditing({ ...editing, cotizarHref: e.target.value })}
                  className={inputCls}
                  placeholder="/cotizar?servicio=casa"
                />
              </Field>
              <Field label="Texto del botón CTA">
                <input
                  type="text"
                  value={editing.cta}
                  onChange={(e) => setEditing({ ...editing, cta: e.target.value })}
                  className={inputCls}
                  placeholder="Cotizar servicio hogar"
                />
              </Field>
            </div>
            <Field label="Imagen">
              <ImagePicker
                value={editing.image}
                onChange={(v) => setEditing({ ...editing, image: v })}
              />
            </Field>
          </div>
          <div className="flex gap-3 mt-6">
            <Btn onClick={save}>Guardar</Btn>
            <Btn variant="secondary" onClick={cancel}>Cancelar</Btn>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map((s) => (
          <div
            key={s.id}
            className="rounded-3xl bg-white p-5 shadow-[0_12px_40px_rgba(10,20,40,0.08)] flex items-center gap-5"
          >
            {s.image ? (
              <img src={s.image} alt="" className="h-20 w-28 flex-shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="h-20 w-28 flex-shrink-0 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sin imagen</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-mono">{s.n}</div>
              <div className="font-semibold text-slate-900">{s.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{s.sub}</div>
              <div className="text-xs text-blue-500 mt-1 font-mono truncate">{s.cotizarHref}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => openEdit(s)}
                className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                onClick={() => del(s.id)}
                className="rounded-xl border border-red-100 text-red-500 px-3 py-2 text-xs font-semibold hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-500">
          Aún no hay servicios publicados. Crea uno para mostrarlo en la home y en el cotizador.
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   GIFT CARDS TAB
────────────────────────────────────────── */
function GiftCardsTab({ tick, bump }: { tick: number; bump: () => void }) {
  const [giftCards, setGiftCards] = useState(getGiftCards());
  const [amounts, setAmounts] = useState<number[]>([]);
  const [newAmountInput, setNewAmountInput] = useState("");
  const [createAmount, setCreateAmount] = useState(50000);
  const [customCreate, setCustomCreate] = useState("");

  useEffect(() => {
    setGiftCards(getGiftCards());
    setAmounts(getGiftAmounts());
  }, [tick]);

  const saveAmounts = () => {
    setGiftAmounts(amounts);
    bump();
  };

  const addAmount = () => {
    const v = Number(newAmountInput);
    if (!v || v <= 0) { alert("Ingresa un monto válido."); return; }
    if (amounts.includes(v)) return;
    setAmounts([...amounts, v].sort((a, b) => a - b));
    setNewAmountInput("");
  };

  const removeAmount = (a: number) => setAmounts(amounts.filter((x) => x !== a));

  const generate = () => {
    const amt = customCreate ? Number(customCreate) : createAmount;
    if (!amt || amt <= 0) { alert("Ingresa un monto válido."); return; }
    createGiftCard(amt);
    setGiftCards(getGiftCards());
    setCustomCreate("");
    bump();
  };

  const disable = (code: string) => {
    if (!confirm(`¿Deshabilitar la Gift Card ${code}?`)) return;
    disableGiftCard(code);
    setGiftCards(getGiftCards());
  };

  return (
    <div className="space-y-8">

      {/* Montos disponibles en tienda */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(10,20,40,0.08)]">
        <SectionTitle>Montos disponibles en tienda</SectionTitle>
        <p className="text-xs text-slate-500 mt-1 mb-4">Estos montos aparecen en la sección Gift Cards del sitio.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {amounts.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold"
              style={{ color: NAVY }}
            >
              {formatCLP(a)}
              <button
                onClick={() => removeAmount(a)}
                className="text-red-400 hover:text-red-600 font-bold leading-none text-base"
              >
                ×
              </button>
            </span>
          ))}
          {amounts.length === 0 && <span className="text-xs text-slate-400">Sin montos configurados.</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            value={newAmountInput}
            onChange={(e) => setNewAmountInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAmount()}
            placeholder="Ej: 200000"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-36"
          />
          <Btn variant="yellow" onClick={addAmount}>Agregar monto</Btn>
          <Btn onClick={saveAmounts}>Guardar cambios</Btn>
        </div>
      </div>

      {/* Crear Gift Card manual */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(10,20,40,0.08)]">
        <SectionTitle>Generar Gift Card manual</SectionTitle>
        <p className="text-xs text-slate-500 mt-1 mb-4">Crea un código gift card para entregar a un cliente.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {[50000, 100000, 150000, 200000, 300000].map((a) => (
            <button
              key={a}
              onClick={() => { setCreateAmount(a); setCustomCreate(""); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold border transition-all ${
                createAmount === a && !customCreate
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {formatCLP(a)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            value={customCreate}
            onChange={(e) => setCustomCreate(e.target.value)}
            placeholder="Monto personalizado"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-44"
          />
          <Btn onClick={generate}>Generar código</Btn>
        </div>
      </div>

      {/* Lista Gift Cards */}
      <div className="rounded-3xl bg-white p-6 shadow-[0_12px_40px_rgba(10,20,40,0.08)]">
        <SectionTitle>Gift Cards emitidas ({giftCards.length})</SectionTitle>
        {giftCards.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">No hay gift cards aún.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-400 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-semibold">Código</th>
                  <th className="pb-2 pr-4 font-semibold">Monto</th>
                  <th className="pb-2 pr-4 font-semibold">Saldo</th>
                  <th className="pb-2 pr-4 font-semibold">Estado</th>
                  <th className="pb-2 pr-4 font-semibold">Creada</th>
                  <th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {giftCards.map((gc) => (
                  <tr key={gc.code}>
                    <td className="py-3 pr-4 font-mono text-xs font-semibold text-slate-700">{gc.code}</td>
                    <td className="py-3 pr-4 text-slate-700">{formatCLP(gc.initialAmount)}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ color: NAVY }}>{formatCLP(gc.balance)}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        gc.status === "active"
                          ? "bg-green-100 text-green-700"
                          : gc.status === "used"
                          ? "bg-slate-100 text-slate-500"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {gc.status === "active" ? "Activa" : gc.status === "used" ? "Usada" : "Deshabilitada"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-slate-400">
                      {new Date(gc.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td className="py-3">
                      {gc.status === "active" && (
                        <button
                          onClick={() => disable(gc.code)}
                          className="rounded-xl border border-red-100 text-red-500 px-2.5 py-1 text-xs font-semibold hover:bg-red-50 transition"
                        >
                          Deshabilitar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   ORDERS TAB
────────────────────────────────────────── */
function OrdersTab({ tick, bump }: { tick: number; bump: () => void }) {
  const orders = getOrders();
  const [manualMonth, setManualMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [manualDate, setManualDate] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, "0");
    const d = `${now.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const formatServiceDateLabel = (dateKey: string) =>
    new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const canManageManualDate = /^\d{4}-\d{2}-\d{2}$/.test(manualDate);
  const manualAMStatus = canManageManualDate ? getServiceSlotStatus(manualDate, "AM") : null;
  const manualPMStatus = canManageManualDate ? getServiceSlotStatus(manualDate, "PM") : null;

  const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calendarDays = (() => {
    const year = manualMonth.getFullYear();
    const month = manualMonth.getMonth();
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
  })();

  const handleManualDateChange = (value: string) => {
    setManualDate(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return;
    setManualMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] border border-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-base font-semibold" style={{ color: NAVY }}>Bloqueo manual de agenda</div>
            <div className="mt-1 text-sm text-slate-500">Marca una fecha AM/PM como reservado u ocupado, aunque no existan pedidos.</div>
          </div>
          <div className="w-full sm:w-[240px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Fecha</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => handleManualDateChange(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setManualMonth(new Date(manualMonth.getFullYear(), manualMonth.getMonth() - 1, 1))}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
              style={{ color: NAVY }}
            >
              Anterior
            </button>
            <div className="text-sm font-semibold capitalize" style={{ color: NAVY }}>
              {manualMonth.toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={() => setManualMonth(new Date(manualMonth.getFullYear(), manualMonth.getMonth() + 1, 1))}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
              style={{ color: NAVY }}
            >
              Siguiente
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => (
              <div key={label} className="py-1">{label}</div>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="h-9 rounded-xl bg-white/60" />;

              const amStatus = getServiceSlotStatus(day.dateKey, "AM");
              const pmStatus = getServiceSlotStatus(day.dateKey, "PM");
              const full = !!amStatus && !!pmStatus;
              const partial = !full && (!!amStatus || !!pmStatus);
              const selected = day.dateKey === manualDate;

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => handleManualDateChange(day.dateKey)}
                  className={`h-9 rounded-xl border text-xs font-semibold transition-all ${
                    selected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : full
                      ? "border-red-100 bg-red-50 text-red-600"
                      : partial
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                  }`}
                  title={full ? "AM/PM ocupado o reservado" : partial ? "Disponible solo en AM o PM" : "Disponible"}
                >
                  {day.dayNumber}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white border border-slate-300" />Disponible</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-300" />Parcial</div>
            <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-300" />Completo</div>
          </div>
        </div>

        {!canManageManualDate ? (
          <div className="mt-4 text-sm text-red-500">Selecciona una fecha válida para gestionar bloques.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["AM", "PM"] as ServiceShift[]).map((shift) => {
              const status = shift === "AM" ? manualAMStatus : manualPMStatus;
              return (
                <div key={shift} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold" style={{ color: NAVY }}>Bloque {shift}</div>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      status === "ocupado"
                        ? "bg-red-100 text-red-700"
                        : status === "reservado"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {status === "ocupado" ? "Ocupado" : status === "reservado" ? "Reservado" : "Disponible"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      onClick={() => { setServiceSlotStatus(manualDate, shift, "reservado"); bump(); }}
                    >
                      Reservar
                    </button>
                    <button
                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                      onClick={() => { setServiceSlotStatus(manualDate, shift, "ocupado"); bump(); }}
                    >
                      Ocupar
                    </button>
                    <button
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      onClick={() => { setServiceSlotStatus(manualDate, shift, null); bump(); }}
                    >
                      Liberar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SectionTitle>Pedidos ({orders.length})</SectionTitle>
      {orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-7 text-center text-sm text-slate-500">
          Aún no hay pedidos registrados. Cuando un cliente pague, aparecerán aquí para gestión de estado.
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.id} className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">{o.id}</div>
                <div className="text-xs text-slate-500">
                  {new Date(o.createdAt).toLocaleString("es-CL")} · {getUserById(o.userId)?.email ?? o.userId}
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  Método: <b>{o.paymentMethod}</b>
                  {o.giftCardCodeUsed ? <> · Gift: <b>{o.giftCardCodeUsed}</b></> : null}
                </div>
                <div className="mt-2 text-sm font-semibold" style={{ color: NAVY }}>
                  Total: {formatCLP(o.totalPaid)}
                </div>
                <div className="mt-3 space-y-1">
                  {o.items.map((item) => {
                    const serviceDate = typeof item.meta?.serviceDate === "string" ? item.meta.serviceDate : null;
                    const serviceShift = typeof item.meta?.serviceShift === "string" ? item.meta.serviceShift : null;
                    const shiftOptions = serviceShift === "AM" || serviceShift === "PM"
                      ? [serviceShift as ServiceShift]
                      : (["AM", "PM"] as ServiceShift[]);

                    return (
                      <div key={item.id} className="text-xs text-slate-500">
                        <div>· {item.name} × {item.qty} — {formatCLP(item.price)}</div>
                        {item.type === "service" && serviceDate && /^\d{4}-\d{2}-\d{2}$/.test(serviceDate) && (
                          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="font-semibold text-slate-700">
                              Fecha: {formatServiceDateLabel(serviceDate)}
                              {serviceShift ? ` · ${serviceShift}` : " · sin bloque (AM/PM)"}
                            </div>

                            <div className="mt-2 space-y-2">
                              {shiftOptions.map((shift) => {
                                const slotStatus = getServiceSlotStatus(serviceDate, shift);
                                return (
                                  <div key={`${item.id}-${shift}`} className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex min-w-[70px] items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                                      {shift}
                                    </span>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                                      slotStatus === "ocupado"
                                        ? "bg-red-100 text-red-700"
                                        : slotStatus === "reservado"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}>
                                      {slotStatus === "ocupado" ? "Ocupado" : slotStatus === "reservado" ? "Reservado" : "Disponible"}
                                    </span>
                                    <button
                                      className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                                      onClick={() => { setServiceSlotStatus(serviceDate, shift, "reservado"); bump(); }}
                                    >
                                      Reservar
                                    </button>
                                    <button
                                      className="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                                      onClick={() => { setServiceSlotStatus(serviceDate, shift, "ocupado"); bump(); }}
                                    >
                                      Ocupar
                                    </button>
                                    <button
                                      className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                      onClick={() => { setServiceSlotStatus(serviceDate, shift, null); bump(); }}
                                    >
                                      Liberar
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
                {o.status}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-slate-400 mb-2">Cambiar estado:</p>
              <div className="flex flex-wrap gap-2">
                {["Pagado", "Enviado", "Recepcionado", "Agendado", "En servicio", "Finalizado"].map((s) => (
                  <button
                    key={s}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                      o.status === s
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => { updateOrderStatus(o.id, s as any); bump(); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN ADMIN PAGE
────────────────────────────────────────── */
export default function AdminPage() {
  const mounted = useMounted();
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("orders");

  const bump = () => setTick((x) => x + 1);

  const user = mounted ? getSessionUser() : null;

  if (!mounted) return <div className="min-h-screen bg-[#F7F7F7]" />;

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7] px-5">
        <div className="rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
          <div className="text-xl font-semibold" style={{ color: NAVY }}>Sin acceso</div>
          <div className="mt-2 text-slate-600">Esta sección es solo para admin.</div>
          <a className="mt-4 inline-block rounded-full px-4 py-2 border border-slate-200 text-sm" href="/">Volver</a>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "orders", label: "Pedidos" },
    { key: "products", label: "Productos" },
    { key: "services", label: "Servicios" },
    { key: "giftcards", label: "Gift Cards" },
  ];

  const ordersCount = getOrders().length;
  const productsCount = getCatalogProducts().length;
  const servicesCount = getCatalogServices().length;
  const activeGiftCardsCount = getGiftCards().filter((g) => g.status === "active").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef4ff_0%,_#F7F7F7_45%,_#F7F7F7_100%)]">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6 py-10">
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white p-6 md:p-7 shadow-[0_20px_60px_rgba(10,20,40,0.08)] mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs tracking-[0.16em] uppercase text-slate-500">Admin</div>
              <h1 className="mt-1 text-3xl font-semibold" style={{ color: NAVY }}>Panel de administración</h1>
              <p className="mt-2 text-sm text-slate-500">Gestiona catálogo, servicios, gift cards y pedidos desde un solo lugar.</p>
            </div>
            <a
              className="rounded-full px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all duration-200"
              style={{ background: YELLOW }}
              href="/account"
            >
              Volver a cuenta
            </a>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Pedidos</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{ordersCount}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Productos</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{productsCount}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Servicios</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{servicesCount}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Gift activas</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{activeGiftCardsCount}</div>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 shadow-[0_4px_20px_rgba(10,20,40,0.07)] mb-8 w-fit border border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                activeTab === t.key
                  ? "text-white shadow-md"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              style={activeTab === t.key ? { background: NAVY } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "orders" && <OrdersTab tick={tick} bump={bump} />}
        {activeTab === "products" && <ProductsTab tick={tick} bump={bump} />}
        {activeTab === "services" && <ServicesTab tick={tick} bump={bump} />}
        {activeTab === "giftcards" && <GiftCardsTab tick={tick} bump={bump} />}
      </div>
    </div>
  );
}
