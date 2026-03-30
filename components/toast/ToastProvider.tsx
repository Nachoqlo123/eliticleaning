"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: "success" | "info" | "error";
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id"> & { durationMs?: number }) => void;
};

const ToastCtx = createContext<ToastContextValue | null>(null);

function uid() {
  return `t_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<Record<string, any>>({});

  const remove = useCallback((id: string) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
    const t = timers.current[id];
    if (t) clearTimeout(t);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id"> & { durationMs?: number }) => {
      const id = uid();
      const toast: Toast = { id, title: t.title, message: t.message, variant: t.variant ?? "success" };
      setItems((xs) => [toast, ...xs].slice(0, 4));
      const duration = t.durationMs ?? 2600;
      timers.current[id] = setTimeout(() => remove(id), duration);
    },
    [remove]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[9999] flex w-[340px] max-w-[90vw] flex-col gap-3">
        {items.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border bg-white px-4 py-3 shadow-[0_20px_60px_rgba(10,20,40,0.18)] animate-[toastIn_.18s_ease-out]"
            style={{
              borderColor:
                t.variant === "success"
                  ? "rgba(16,185,129,0.35)"
                  : t.variant === "error"
                  ? "rgba(239,68,68,0.35)"
                  : "rgba(148,163,184,0.5)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {t.title && <div className="text-sm font-semibold text-slate-900">{t.title}</div>}
                <div className="text-sm text-slate-700">{t.message}</div>
              </div>
              <button
                className="rounded-full px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                onClick={() => remove(t.id)}
              >
                ✕
              </button>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-full origin-left animate-[toastBar_2.6s_linear] bg-slate-900/30" />
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider />");
  return ctx;
}
