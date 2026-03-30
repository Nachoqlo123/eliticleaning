"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCart, getSessionUser } from "@/lib/store";
import { supaGetUser, supaGetProfile } from "@/lib/supabaseClient";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";

function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path {...common} d="M6 6h15l-1.5 9h-12z" />
      <path {...common} d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" {...common} />
      <circle cx="18" cy="20" r="1" {...common} />
    </svg>
  );
}

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const updateHeaderState = () => {
    setIsLoggedIn(!!getSessionUser());
    const count = getCart().reduce((acc, item) => acc + item.qty, 0);
    setCartCount(count);
  };

  useEffect(() => {
    updateHeaderState();

    // Sync Supabase session to localStorage (in case user is logged in via Supabase but localStorage was cleared)
    (async () => {
      try {
        const supaUser = await supaGetUser();
        if (supaUser) {
          const profile = await supaGetProfile(supaUser.id);
          const role = profile?.role ?? "client";
          localStorage.setItem("ec_session_v1", JSON.stringify({ userId: supaUser.id }));
          const usersRaw = localStorage.getItem("ec_users_v1");
          const users: any[] = usersRaw ? JSON.parse(usersRaw) : [];
          const existing = users.findIndex((u: any) => u.id === supaUser.id);
          const localUser = { id: supaUser.id, email: supaUser.email!, password: "", role };
          if (existing >= 0) users[existing] = localUser;
          else users.push(localUser);
          localStorage.setItem("ec_users_v1", JSON.stringify(users));
          updateHeaderState();
        }
      } catch {
        // Supabase not configured or offline — fallback to localStorage
      }
    })();

    const onStorage = () => updateHeaderState();
    const onFocus = () => updateHeaderState();
    const onCartUpdated = () => updateHeaderState();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("ec:cart-updated", onCartUpdated as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("ec:cart-updated", onCartUpdated as EventListener);
    };
  }, []);

  const cartBadge = useMemo(() => (cartCount > 99 ? "99+" : `${cartCount}`), [cartCount]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[70] m-0 p-0 backdrop-blur-sm"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(2,6,23,0.50) 0px, rgba(2,6,23,0.24) 36px, rgba(2,6,23,0) 72px)",
      }}
    >
      <div className="mx-auto w-full max-w-[1160px] px-3 sm:px-5 md:px-6">
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-y-2 pt-1 pb-2 md:pt-0 md:pb-4">
          <a href="/" className="flex min-w-0 items-center self-center shrink-0 pl-1 sm:pl-2 lg:pl-[30px] pr-2 py-0">
            <img
              src="/products/logo-header.png?v=1"
              alt="Elite Cleaning"
              className="h-[44px] sm:h-[54px] md:h-[62px] lg:h-[78px] w-auto max-w-[220px] sm:max-w-[270px] md:max-w-[310px] lg:max-w-none object-contain [filter:contrast(1.22)_saturate(1.12)_brightness(1.14)] [image-rendering:-webkit-optimize-contrast] drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
            />
          </a>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-6 xl:gap-8 text-[18px] xl:text-[20px] font-medium text-white/85 px-4">
            <a className="hover:text-white transition-colors" href="/cotizar">Cotizar</a>
            <a className="hover:text-white transition-colors" href="/#services">Servicios</a>
            <a className="hover:text-white transition-colors" href="/tienda">Tienda</a>
            <a className="hover:text-white transition-colors" href="/#giftcards">Gift Cards</a>
            <a className="hover:text-white transition-colors" href="/#contact">Contacto</a>
          </nav>

          <div className="flex items-center self-center gap-2 ml-auto lg:ml-4 shrink-0">
            <a
              href="/cart"
              className="relative rounded-full px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-base font-semibold whitespace-nowrap"
              style={{ background: YELLOW, color: "white" }}
              title="Carrito"
            >
              <span className="inline-flex items-center gap-1.5 sm:gap-2"><CartIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Carrito</span>
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold grid place-items-center bg-white text-[#1E3A8A] shadow-[0_8px_16px_rgba(0,0,0,0.25)]">
                {cartBadge}
              </span>
            </a>

            <a
              href={isLoggedIn ? "/account" : "/login"}
              className="rounded-full px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base font-semibold bg-white hover:bg-white/90 transition whitespace-nowrap"
              style={{ color: NAVY }}
            >
              {isLoggedIn ? "Mi cuenta" : "Login"}
            </a>
          </div>

          <nav className="flex lg:hidden w-full overflow-x-auto whitespace-nowrap gap-4 pt-1 pb-1 text-sm sm:text-base font-medium text-white/85 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <a className="hover:text-white transition-colors" href="/cotizar">Cotizar</a>
            <a className="hover:text-white transition-colors" href="/#services">Servicios</a>
            <a className="hover:text-white transition-colors" href="/tienda">Tienda</a>
            <a className="hover:text-white transition-colors" href="/#giftcards">Gift Cards</a>
            <a className="hover:text-white transition-colors" href="/#contact">Contacto</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
