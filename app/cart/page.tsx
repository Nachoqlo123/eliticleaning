"use client";

import React, { useMemo, useState } from "react";
import {
  clearCart,
  createGiftCard,
  createOrder,
  formatCLP,
  getCart,
  getSessionUser,
  removeFromCart,
  spendGiftCard,
  validateGiftCard,
  updateCartItemQuantity,
} from "@/lib/store";
import { supaInsertOrder, supaGetUser } from "@/lib/supabaseClient";
import { useMounted } from "@/components/hooks/useMounted";
import { useToast } from "@/components/toast/ToastProvider";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

export default function CartPage() {
  const mounted = useMounted();
  const { push } = useToast();

  const [tick, setTick] = useState(0);
  const cart = useMemo(() => (mounted ? getCart() : []), [tick, mounted]);
  const user = useMemo(() => (mounted ? getSessionUser() : null), [tick, mounted]);

  const subtotal = cart.reduce((a, it) => a + it.price * it.qty, 0);

  const [method, setMethod] = useState<"webpay" | "giftcard">("webpay");
  const [giftCode, setGiftCode] = useState("");
  const [giftMsg, setGiftMsg] = useState<string | null>(null);
  const [giftDiscount, setGiftDiscount] = useState(0);

  const totalAfterGift = Math.max(0, subtotal - giftDiscount);

  function requireLogin() {
    if (!user) {
      push({ title: "Inicia sesión", message: "Debes iniciar sesión para pagar.", variant: "info" });
      window.location.href = "/login";
      return false;
    }
    return true;
  }

  function applyGift() {
    setGiftMsg(null);
    const code = giftCode.trim();
    if (!code) {
      setGiftDiscount(0);
      setGiftMsg("Ingresa un código.");
      return;
    }
    const res = validateGiftCard(code);
    if (!res.ok) {
      setGiftDiscount(0);
      setGiftMsg(res.reason ?? null);
      return;
    }
    const giftBalance = res.gift?.balance ?? 0;
    const discount = Math.min(subtotal, giftBalance);
    setGiftDiscount(discount);
    if (res.gift) {
      setGiftMsg(`Gift Card válida. Saldo: ${formatCLP(res.gift.balance)}. Se aplicará: ${formatCLP(discount)}`);
    } else {
      setGiftMsg("");
    }
  }

  async function pay() {
    if (!requireLogin()) return;
    if (cart.length === 0) {
      push({ title: "Carrito vacío", message: "Agrega productos o servicios primero.", variant: "info" });
      return;
    }

    if (method === "giftcard") {
      const code = giftCode.trim();
      const res = validateGiftCard(code);
      if (!res.ok) {
        push({ title: "Gift Card inválida", message: res.reason ?? "Gift Card inválida.", variant: "error" });
        return;
      }

      const { spent } = spendGiftCard(code, subtotal);

      const order = createOrder({
        userId: user!.id,
        items: cart,
        paymentMethod: "giftcard",
        giftCardCode: code,
        discountGiftCard: spent,
        totalPaid: spent,
        paymentRef: `GC-${Date.now()}`,
        status: cart.some((i) => i.type === "service") ? "Agendado" : "Pagado",
      });

      // Guardar en Supabase
      console.log("guardando orden en Supabase...");
      try {
        const supaUser = await supaGetUser();
        if (supaUser) {
          await supaInsertOrder({
            user_id: supaUser.id,
            items: cart,
            subtotal: cart.reduce((a, it) => a + it.price * it.qty, 0),
            discount_giftcard: spent,
            total_paid: spent,
            payment_method: "giftcard",
            payment_ref: `GC-${Date.now()}`,
            status: cart.some((i) => i.type === "service") ? "Agendado" : "Pagado",
            kind: order.kind,
          });
          console.log("Orden guardada correctamente en Supabase");
        }
      } catch (err) {
        console.error("Supabase error:", err);
      }

      // Crear Gift Cards después del pago
      const giftCardItems = cart.filter((item) => item.type === "giftcard");
      const createdGiftCards = [];
      for (const item of giftCardItems) {
        for (let i = 0; i < item.qty; i++) {
          const gc = createGiftCard(item.meta?.amount || item.price, user!.id);
          createdGiftCards.push(gc);
        }
      }

      clearCart();
      setTick((x) => x + 1);

      if (createdGiftCards.length > 0) {
        const codes = createdGiftCards.map(gc => gc.code).join(", ");
        push({ title: "Pago exitoso", message: `Gift Cards creadas: ${codes} · Pedido ${order.id}`, variant: "success", durationMs: 6000 });
      } else {
        push({ title: "Pago exitoso", message: `Pagado con Gift Card · Pedido ${order.id}`, variant: "success", durationMs: 4200 });
      }

      window.location.href = "/account";
      return;
    }

    // Webpay (demo)
    let discount = 0;
    let usedGc: string | undefined = undefined;

    if (giftDiscount > 0 && giftCode.trim()) {
      const code = giftCode.trim();
      const res = validateGiftCard(code);
      if (res.ok) {
        const { spent } = spendGiftCard(code, subtotal);
        discount = spent;
        usedGc = code;
      }
    }

    const order = createOrder({
      userId: user!.id,
      items: cart,
      paymentMethod: "webpay",
      giftCardCode: usedGc,
      discountGiftCard: discount,
      totalPaid: subtotal - discount,
      paymentRef: `WP_SIM_${Date.now()}`,
      status: cart.some((i) => i.type === "service") ? "Agendado" : "Pagado",
    });

    // Guardar en Supabase
    console.log("guardando orden en Supabase...");
    try {
      const supaUser = await supaGetUser();
      if (supaUser) {
        await supaInsertOrder({
          user_id: supaUser.id,
          items: cart,
          subtotal,
          discount_giftcard: discount,
          total_paid: subtotal - discount,
          payment_method: "webpay",
          payment_ref: `WP_SIM_${Date.now()}`,
          status: cart.some((i) => i.type === "service") ? "Agendado" : "Pagado",
          kind: order.kind,
        });
        console.log("Orden guardada correctamente en Supabase");
      }
    } catch (err) {
      console.error("Supabase error:", err);
    }

    // Crear Gift Cards después del pago
    const giftCardItems = cart.filter((item) => item.type === "giftcard");
    const createdGiftCards = [];
    for (const item of giftCardItems) {
      for (let i = 0; i < item.qty; i++) {
        const gc = createGiftCard(item.meta?.amount || item.price, user!.id);
        createdGiftCards.push(gc);
      }
    }

    clearCart();
    setTick((x) => x + 1);

    if (createdGiftCards.length > 0) {
      const codes = createdGiftCards.map(gc => gc.code).join(", ");
      push({ title: "Pago exitoso", message: `Gift Cards creadas: ${codes} · Pedido ${order.id}`, variant: "success", durationMs: 6000 });
    } else {
      push({ title: "Pago exitoso", message: `Webpay (demo) · Pedido ${order.id}`, variant: "success", durationMs: 4200 });
    }

    window.location.href = "/account";
  }

  if (!mounted) {
    return <div className="min-h-screen bg-[#F7F7F7]" />;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.16em] uppercase text-slate-500">EliteCleaning</div>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: NAVY }}>
              Carrito & Checkout
            </h1>
          </div>

          <div className="flex gap-2">
            <a className="rounded-full px-4 py-2 text-sm font-medium border border-slate-200 bg-white" href="/">
              Volver
            </a>
            <a className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: YELLOW, color: "white" }} href="/account">
              Mi cuenta
            </a>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>Items</div>

            <div className="mt-4 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <div className="text-lg font-semibold" style={{ color: NAVY }}>Tu carrito está vacío por ahora</div>
                  <p className="mt-2 text-slate-600">Explora la tienda para agregar insumos o vuelve al inicio para cotizar un servicio de limpieza.</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a href="/tienda" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Ir a la tienda</a>
                    <a href="/cotizar" className="rounded-full px-4 py-2 text-sm font-semibold" style={{ background: YELLOW, color: "white" }}>Cotizar servicio</a>
                  </div>
                </div>
              ) : (
                cart.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-4">
                      {it.image && (
                        <img src={it.image} className="h-14 w-14 rounded-xl object-cover border border-slate-200" alt="" />
                      )}
                      <div>
                        <div className="font-medium text-slate-900">{it.name}</div>
                        {it.type === "service" && typeof it.meta?.serviceDate === "string" && (
                          <div className="mt-1 text-sm text-slate-500">
                            Fecha: {new Date(`${it.meta.serviceDate}T12:00:00`).toLocaleDateString("es-CL", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                            {typeof it.meta?.serviceShift === "string" ? ` · ${it.meta.serviceShift}` : ""}
                          </div>
                        )}
                        <div className="text-sm text-slate-600 flex items-center gap-3">
                          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-2 py-1">
                            <button
                              className="text-slate-600 hover:text-slate-900 font-semibold w-6 h-6 flex items-center justify-center"
                              onClick={() => {
                                updateCartItemQuantity(it.id, it.qty - 1);
                                setTick((x) => x + 1);
                              }}
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-medium">{it.qty}</span>
                            <button
                              className="text-slate-600 hover:text-slate-900 font-semibold w-6 h-6 flex items-center justify-center"
                              onClick={() => {
                                updateCartItemQuantity(it.id, it.qty + 1);
                                setTick((x) => x + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                          <span>× {formatCLP(it.price)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="text-sm font-semibold text-red-600"
                      onClick={() => {
                        removeFromCart(it.id);
                        setTick((x) => x + 1);
                        push({ title: "Eliminado", message: "Item eliminado del carrito.", variant: "info" });
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
            <div className="text-sm font-semibold" style={{ color: NAVY }}>Resumen</div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between"><span>Subtotal</span><b>{formatCLP(subtotal)}</b></div>
              <div className="flex justify-between"><span>Gift Card</span><b>- {formatCLP(giftDiscount)}</b></div>
              <div className="pt-3 mt-3 border-t border-slate-200 flex justify-between text-base">
                <span>Total</span><b style={{ color: NAVY }}>{formatCLP(totalAfterGift)}</b>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs tracking-[0.16em] uppercase text-slate-500">Método de pago</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[{ v: "webpay", t: "Webpay" }, { v: "giftcard", t: "Gift Card" }].map((x) => (
                  <button
                    key={x.v}
                    className="rounded-2xl px-3 py-3 text-sm font-semibold border transition-transform duration-500 ease-in-out hover:-translate-y-[0.5px] active:scale-[0.99]"
                    style={{
                      borderColor: method === x.v ? "rgba(10,20,40,0.25)" : "rgba(148,163,184,0.5)",
                      background: method === x.v ? "#F7F7F7" : "white",
                      color: NAVY,
                    }}
                    onClick={() => setMethod(x.v as any)}
                  >
                    {x.t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs tracking-[0.16em] uppercase text-slate-500">Gift Card (opcional)</div>
              <div className="mt-2 flex gap-2">
                <input
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-300"
                  placeholder="EC-XXXX-XXXX-XXXX"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                />
                <button className="rounded-2xl px-4 py-3 text-sm font-semibold transition-transform duration-500 ease-in-out hover:-translate-y-[0.5px] active:scale-[0.99]" style={{ background: YELLOW, color: "white" }} onClick={applyGift}>
                  Aplicar
                </button>
              </div>
              {giftMsg && <div className="mt-2 text-xs text-slate-600">{giftMsg}</div>}
            </div>

            <button className="mt-6 w-full rounded-2xl px-4 py-3 text-sm font-semibold transition-transform duration-500 ease-in-out hover:-translate-y-[0.5px] active:scale-[0.99]" style={{ background: NAVY, color: "white" }} onClick={pay}>
              Pagar ahora
            </button>

            <div className="mt-3 text-xs text-slate-500">
              Webpay está en modo <b>demo</b> (simulado).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
