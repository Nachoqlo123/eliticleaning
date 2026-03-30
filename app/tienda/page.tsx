"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { useMounted } from "@/components/hooks/useMounted";
import { addToCart, formatCLP, getCart, getCatalogProducts, type CatalogProduct } from "@/lib/store";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

type SortKey = "destacados" | "recomendados" | "priceAsc" | "priceDesc" | "nameAsc";

const BADGE_LABEL: Record<Exclude<CatalogProduct["badge"], "">, string> = {
  "destacado": "Destacado",
  "nuevo": "Nuevo",
  "mas-vendido": "Más vendido",
  "recomendado": "Recomendado",
};

function scoreByBadge(badge: CatalogProduct["badge"]) {
  if (badge === "mas-vendido") return 4;
  if (badge === "destacado") return 3;
  if (badge === "recomendado") return 2;
  if (badge === "nuevo") return 1;
  return 0;
}

function uniqueCategories(products: CatalogProduct[]) {
  return Array.from(new Set(products.map((product) => product.category.trim() || "General"))).sort((a, b) => a.localeCompare(b));
}

export default function StorePage() {
  const mounted = useMounted();
  const { push } = useToast();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState<SortKey>("destacados");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    const list = getCatalogProducts();
    setProducts(list);
  }, [mounted]);

  const categories = useMemo(() => ["Todas", ...uniqueCategories(products)], [products]);
  const cart = useMemo(() => (mounted ? getCart() : []), [mounted, tick]);
  const cartQty = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + item.qty * item.price, 0), [cart]);

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    const parsedMin = minValue.trim() === "" ? null : Number(minValue);
    const parsedMax = maxValue.trim() === "" ? null : Number(maxValue);

    const filtered = products.filter((product) => {
      const matchesSearch = !search || `${product.name} ${product.desc} ${product.category}`.toLowerCase().includes(search);
      const matchesCategory = category === "Todas" || product.category === category;
      const matchesMin = parsedMin === null || product.price >= parsedMin;
      const matchesMax = parsedMax === null || product.price <= parsedMax;
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });

    if (sortBy === "destacados") return [...filtered].sort((a, b) => scoreByBadge(b.badge) - scoreByBadge(a.badge));
    if (sortBy === "recomendados") return [...filtered].sort((a, b) => {
      const ar = a.badge === "recomendado" || a.badge === "mas-vendido" ? 1 : 0;
      const br = b.badge === "recomendado" || b.badge === "mas-vendido" ? 1 : 0;
      if (ar !== br) return br - ar;
      return a.price - b.price;
    });
    if (sortBy === "priceAsc") return [...filtered].sort((a, b) => a.price - b.price);
    if (sortBy === "priceDesc") return [...filtered].sort((a, b) => b.price - a.price);
    if (sortBy === "nameAsc") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [category, maxValue, minValue, products, query, sortBy]);

  const addProduct = (product: CatalogProduct) => {
    if (product.stock <= 0) {
      push({ title: "Sin stock", message: "Este producto no tiene stock disponible por ahora.", variant: "info" });
      return;
    }
    addToCart({ type: "product", name: product.name, price: product.price, qty: 1, image: product.image });
    push({ title: "Agregado al carrito", message: `${product.name} se agregó correctamente.`, variant: "success" });
    setTick((value) => value + 1);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#F7F7F7]" />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-900">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6 py-8 md:py-12">
        <div className="flex flex-col gap-4 rounded-[32px] bg-white p-6 md:p-8 shadow-[0_24px_70px_rgba(10,20,40,0.10)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Tienda</div>
              <h1 className="mt-3 text-[34px] sm:text-[42px] md:text-[58px] font-light leading-[0.98] tracking-[-0.03em]" style={{ color: NAVY }}>
                Todos los productos
                <br />
                en un solo lugar
              </h1>
              <p className="mt-4 max-w-[700px] text-sm sm:text-base text-slate-600 leading-relaxed">
                Busca, filtra por categoría y acota por precio. Todo lo que agregues desde el panel admin aparece automáticamente aquí.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700" href="/">
                Volver al inicio
              </a>
              <a className="rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: YELLOW, color: NAVY }} href="/cart">
                Ver carrito
              </a>
            </div>
          </div>

          <div id="filtros-productos" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_0.9fr_0.75fr_0.75fr_1fr] gap-3 md:gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, descripción o categoría"
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm outline-none transition focus:border-blue-400"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm outline-none transition focus:border-blue-400"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <input
              type="number"
              min={0}
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="Precio mínimo"
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm outline-none transition focus:border-blue-400"
            />

            <input
              type="number"
              min={0}
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              placeholder="Precio máximo"
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm outline-none transition focus:border-blue-400"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm outline-none transition focus:border-blue-400"
            >
              <option value="destacados">Destacados</option>
              <option value="recomendados">Recomendados</option>
              <option value="priceAsc">Precio: menor a mayor</option>
              <option value="priceDesc">Precio: mayor a menor</option>
              <option value="nameAsc">Nombre: A a Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Mostrando <span className="font-semibold text-slate-800">{filteredProducts.length}</span> de <span className="font-semibold text-slate-800">{products.length}</span> productos
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("Todas");
              setMinValue("");
              setMaxValue("");
              setSortBy("destacados");
            }}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Limpiar filtros
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
              <div className="aspect-[4/3] bg-slate-100">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">Sin imagen</div>
                )}
              </div>

              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{product.category}</div>
                  {product.badge && (
                    <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{BADGE_LABEL[product.badge]}</div>
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold leading-tight" style={{ color: NAVY }}>{product.name}</h2>
                  <div className="text-sm font-semibold whitespace-nowrap" style={{ color: NAVY }}>{formatCLP(product.price)}</div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 min-h-[3.75rem]">{product.desc}</p>

                <div className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-500">
                  <div>Formato: <span className="font-semibold text-slate-700">{product.format}</span></div>
                  <div>Uso recomendado: <span className="font-semibold text-slate-700">{product.recommendedUse}</span></div>
                  <div>Superficie: <span className="font-semibold text-slate-700">{product.surface}</span></div>
                  <div>Stock: <span className={`font-semibold ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>{product.stock > 0 ? `${product.stock} unidades` : "Sin stock"}</span></div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    disabled={product.stock <= 0}
                    className="inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: NAVY }}
                  >
                    Agregar al carrito
                  </button>
                  <a
                    href={`/tienda/${product.id}`}
                    className="inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold"
                    style={{ background: YELLOW, color: NAVY }}
                  >
                    Ver ficha
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="mt-8 rounded-[28px] bg-white p-8 text-center shadow-[0_20px_60px_rgba(10,20,40,0.08)]">
            <div className="text-lg font-semibold" style={{ color: NAVY }}>Aún no encontramos una coincidencia ideal</div>
            <p className="mt-2 text-sm text-slate-600">Prueba otro rango de precio, cambia la categoría o usa "Limpiar filtros" para volver al catálogo completo.</p>
          </div>
        )}
      </div>

      {cartQty > 0 && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[min(94vw,760px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-[0_20px_50px_rgba(10,20,40,0.22)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Resumen carrito</div>
              <div className="text-sm font-semibold" style={{ color: NAVY }}>{cartQty} items · {formatCLP(cartTotal)}</div>
            </div>
            <div className="flex gap-2">
              <a href="/cart" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Ver carrito</a>
              <a href="/cart" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: YELLOW, color: NAVY }}>Ir al pago</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}