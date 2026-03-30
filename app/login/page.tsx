"use client";

import React, { useState } from "react";
import { supaSignIn, supaSignUp, supaGetProfile } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setErr(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await supaSignUp(email, pass);
      }
      // Always sign in (even after register, to get the session)
      const { session, user } = await supaSignIn(email, pass);

      // Sync session to localStorage so synchronous reads (header, cart) still work
      if (user) {
        const profile = await supaGetProfile(user.id);
        const role = profile?.role ?? "client";
        localStorage.setItem(
          "ec_session_v1",
          JSON.stringify({ userId: user.id })
        );
        // Mirror user into localStorage users list for getSessionUser()
        const usersRaw = localStorage.getItem("ec_users_v1");
        const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
        const existing = users.findIndex((u: any) => u.id === user.id);
        const localUser = { id: user.id, email: user.email!, password: "", role };
        if (existing >= 0) users[existing] = localUser;
        else users.push(localUser);
        localStorage.setItem("ec_users_v1", JSON.stringify(users));
      }

      window.location.href = "/account";
    } catch (e: any) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B1C3A" }} className="flex items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
        <div className="text-xs tracking-[0.16em] uppercase text-slate-500">EliteCleaning</div>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h1>

        <div className="mt-6 space-y-3">
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-300"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-300"
            placeholder="Contraseña"
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
          {err && <div className="text-sm text-red-600">{err}</div>}

          <button
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
            style={{ background: "#F4E000", color: "#0B1C3A" }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          <button
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold border border-slate-200"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "No tengo cuenta" : "Ya tengo cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
