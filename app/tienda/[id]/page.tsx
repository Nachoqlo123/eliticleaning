"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMounted } from "@/components/hooks/useMounted";
import { useToast } from "@/components/toast/ToastProvider";
import { addToCart, formatCLP, getCatalogProductById, type CatalogProduct } from "@/lib/store";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

const BADGE_LABEL: Record<Exclude<CatalogProduct["badge"], "">, string> = {
  "destacado": "Destacado",
  "nuevo": "Nuevo",
  "mas-vendido": "Más vendido",
  "recomendado": "Recomendado",
};

export default function ProductDetailPage() {
  const mounted = useMounted();
  const { push } = useToast();
  const params = useParams<{ id: string }>();

  const [product, setProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    if (!mounted || !params?.id) return;
    setProduct(getCatalogProductById(params.id));
  }, [mounted, params?.id]);

  const availability = useMemo(() => {
    if (!product) return "";
    if (product.stock <= 0) return "Sin stock";
    if (product.stock <= 5) return `Últimas ${product.stock} unidades`;
    return `${product.stock} unidades disponibles`;
  }, [product]);

  if (!mounted) return <div className="min-h-screen bg-[#F7F7F7]" />;

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F7F7F7]">
        <div className="mx-auto max-w-[960px] px-5 md:px-6 py-14">
          <div className="rounded-3xl bg-white p-10 text-center shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
            <h1 className="text-2xl font-semibold" style={{ color: NAVY }}>Producto no encontrado</h1>
            <p className="mt-2 text-slate-600">Es posible que haya sido eliminado o que el enlace no esté vigente.</p>
            <div className="mt-6 flex justify-center gap-3">
              <a href="/tienda" className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Volver a tienda</a>
              <a href="/" className="rounded-full px-4 py-2.5 text-sm font-semibold" style={{ background: YELLOW, color: NAVY }}>Ir al inicio</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-slate-900">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6 py-8 md:py-12">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <a href="/" className="hover:text-slate-800">Inicio</a>
          <span>/</span>
          <a href="/tienda" className="hover:text-slate-800">Tienda</a>
          <span>/</span>
          <span className="text-slate-700">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 md:gap-8">
          <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover min-h-[320px]" />
            ) : (
              <div className="min-h-[320px] flex items-center justify-center text-slate-400">Sin imagen disponible</div>
            )}
          </div>

          <div className="rounded-[28px] bg-white p-6 md:p-8 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{product.category}</span>
              {product.badge && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{BADGE_LABEL[product.badge]}</span>}
            </div>

            <h1 className="mt-4 text-[32px] md:text-[42px] font-semibold leading-tight" style={{ color: NAVY }}>{product.name}</h1>
            <p className="mt-3 text-slate-600 leading-relaxed">{product.desc}</p>

            <div className="mt-6 text-3xl font-semibold" style={{ color: NAVY }}>{formatCLP(product.price)}</div>
            <div className={`mt-2 text-sm font-medium ${product.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>{availability}</div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-slate-500 text-xs uppercase tracking-[0.1em]">Formato</div>
                <div className="mt-1 font-semibold text-slate-800">{product.format}</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <div className="text-slate-500 text-xs uppercase tracking-[0.1em]">Superficie</div>
                <div className="mt-1 font-semibold text-slate-800">{product.surface}</div>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="text-slate-500 text-xs uppercase tracking-[0.1em]">Uso recomendado</div>
              <div className="mt-1 font-semibold text-slate-800">{product.recommendedUse}</div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => {
                  addToCart({ type: "product", name: product.name, price: product.price, qty: 1, image: product.image });
                  push({ title: "Agregado al carrito", message: "Producto agregado correctamente.", variant: "success" });
                }}
                className="rounded-full px-5 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: NAVY }}
              >
                Agregar al carrito
              </button>
              <a href="/cart" className="rounded-full px-5 py-3 text-sm font-semibold" style={{ background: YELLOW, color: NAVY }}>
                Comprar ahora
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
