"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMounted } from "@/components/hooks/useMounted";
import { formatCLP, getGiftCards, getSessionUser, logout } from "@/lib/store";
import { supaGetOrders, supaGetUser } from "@/lib/supabaseClient";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

export default function AccountPage() {
  const mounted = useMounted();
  const [tick, setTick] = useState(0);
  const user = useMemo(() => getSessionUser(), [tick]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Fetch orders from Supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingOrders(true);
      try {
        const supaUser = await supaGetUser();
        if (supaUser) {
          const data = await supaGetOrders(supaUser.id);
          setOrders(data);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    })();
  }, [user?.id]);

  if (!mounted) return <div className="min-h-screen bg-[#F7F7F7]" />;

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  const giftcards = getGiftCards().filter((g) => !g.ownerUserId || g.ownerUserId === user.id);
  const totalSpent = orders.reduce((acc, o) => acc + (o.total_paid ?? o.totalPaid ?? 0), 0);
  const activeGiftCards = giftcards.filter((g) => g.status === "active").length;
  const availableGiftBalance = giftcards.reduce((acc, g) => acc + g.balance, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#eef4ff_0%,_#F7F7F7_40%,_#F7F7F7_100%)]">
      <div className="mx-auto max-w-[1160px] px-5 md:px-6 py-10">
        <div className="rounded-3xl bg-white/80 backdrop-blur-sm border border-white p-6 md:p-7 shadow-[0_20px_60px_rgba(10,20,40,0.08)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="text-xs tracking-[0.16em] uppercase text-slate-500">Mi cuenta</div>
              <h1 className="mt-2 text-3xl font-semibold" style={{ color: NAVY }}>{user.email}</h1>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Rol
                <b className="uppercase" style={{ color: NAVY }}>{user.role}</b>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <a className="rounded-full px-4 py-2 text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200" href="/">Home</a>
              <a className="rounded-full px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-all duration-200" style={{ background: YELLOW }} href="/cart">Carrito</a>
              {user.role === "admin" && (
                <a className="rounded-full px-4 py-2 text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200" href="/admin">Admin</a>
              )}
              <button
                className="rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-200"
                style={{ background: NAVY, color: "white" }}
                onClick={() => { logout(); setTick((x) => x + 1); window.location.href = "/"; }}
              >
                Salir
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Pedidos</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{orders.length}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Total comprado</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{formatCLP(totalSpent)}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 border border-slate-100">
              <div className="text-xs text-slate-500">Saldo Gift disponible</div>
              <div className="mt-1 text-2xl font-semibold" style={{ color: NAVY }}>{formatCLP(availableGiftBalance)}</div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] border border-white/70">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold" style={{ color: NAVY }}>Mis pedidos</div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {orders.length} total
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {loadingOrders ? (
                <div className="text-slate-500">Cargando pedidos...</div>
              ) : orders.length === 0 ? (
                <div className="text-slate-600">Aún no tienes pedidos.</div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-slate-200 p-4 bg-white hover:shadow-[0_8px_24px_rgba(10,20,40,0.08)] transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold text-slate-900">{o.id}</div>
                        <div className="text-xs text-slate-500">{new Date(o.created_at ?? o.createdAt).toLocaleString("es-CL")}</div>
                      </div>
                      <div className="text-xs font-semibold rounded-full bg-slate-100 px-2.5 py-1" style={{ color: NAVY }}>{o.status}</div>
                    </div>

                    <div className="mt-3 text-sm text-slate-700">
                      {(o.items ?? []).map((it: any, idx: number) => (
                        <div key={it.id ?? idx} className="flex justify-between">
                          <span>{it.qty}× {it.name}</span>
                          <b>{formatCLP(it.price * it.qty)}</b>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between text-sm gap-4">
                      <span>Método: <b>{o.payment_method ?? o.paymentMethod}</b></span>
                      <span>Total: <b style={{ color: NAVY }}>{formatCLP(o.total_paid ?? o.totalPaid)}</b></span>
                    </div>

                    {(o.giftCardCodeUsed || o.gift_card_code_used) && (
                      <div className="mt-2 text-xs text-slate-500">Gift usada: <b>{o.giftCardCodeUsed ?? o.gift_card_code_used}</b></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] border border-white/70">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold" style={{ color: NAVY }}>Mis Gift Cards</div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {activeGiftCards} activas
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {giftcards.length === 0 ? (
                <div className="text-slate-600">Aún no tienes Gift Cards.</div>
              ) : (
                giftcards.map((g) => (
                  <div key={g.code} className="rounded-2xl border border-slate-200 p-4 bg-white hover:shadow-[0_8px_24px_rgba(10,20,40,0.08)] transition-all duration-300">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm">{g.code}</div>
                      <div
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          background: g.status === "active" ? "#E9FBEF" : g.status === "used" ? "#F1F5F9" : "#FEE2E2",
                          color: g.status === "active" ? "#15803D" : g.status === "used" ? "#475569" : "#B91C1C",
                        }}
                      >
                        {g.status}
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-700 flex justify-between">
                      <span>Saldo</span><b style={{ color: NAVY }}>{formatCLP(g.balance)}</b>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Inicial: {formatCLP(g.initialAmount)} · Creada: {new Date(g.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 text-xs text-slate-500">
              Las Gift Cards sirven para <b>productos y servicios</b> y se aplican en el checkout.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
