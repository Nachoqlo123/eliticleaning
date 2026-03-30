"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/toast/ToastProvider";
import { useMounted } from "@/components/hooks/useMounted";
import { Reveal } from "@/components/hooks/useReveal";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import {
  addToCart, createGiftCard, formatCLP, getSessionUser, seedIfEmpty,
  getCatalogProducts, getCatalogServices, getGiftAmounts,
  type CatalogProduct, type CatalogService,
} from "@/lib/store";

const NAVY = "#0B1C3A";
const YELLOW = "#1D4ED8";
const WHITE = "#FFFFFF";

type ServiceQuoteChoice = {
  title: string;
  href: string;
};

function resolveServiceQuoteHref(href: string | undefined, title: string) {
  const cleanHref = (href ?? "").trim();
  if (cleanHref) return cleanHref;

  const normalizedTitle = title.toLowerCase();
  if (normalizedTitle.includes("oficina")) return "/cotizar?servicio=oficina";
  if (normalizedTitle.includes("smart")) return "/cotizar/adulto-joven";
  if (normalizedTitle.includes("airbnb")) return "/cotizar/airbnb";
  return "/cotizar?servicio=casa";
}

function cl(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "arrowUpRight"
    | "chevronRight"
    | "sparkles"
    | "clock"
    | "shield"
    | "users"
    | "cart";
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "arrowUpRight":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path {...common} d="M7 17L17 7" />
          <path {...common} d="M7 7h10v10" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path {...common} d="M9 18l6-6-6-6" />
        </svg>
      );
    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path {...common} d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2z" />
          <path {...common} d="M5 14l.8 2.4L8 17l-2.2.6L5 20l-.8-2.4L2 17l2.2-.6L5 14z" />
          <path {...common} d="M19 13l.8 2.4L22 16l-2.2.6L19 19l-.8-2.4L16 16l2.2-.6L19 13z" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <circle cx="12" cy="12" r="9" {...common} />
          <path {...common} d="M12 7v6l4 2" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path {...common} d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path {...common} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" {...common} />
          <path {...common} d="M22 21v-2a4 4 0 0 0-3-3.9" />
          <path {...common} d="M16 3.1a3 3 0 0 1 0 5.8" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" className={className}>
          <path {...common} d="M6 6h15l-1.5 9h-12z" />
          <path {...common} d="M6 6 5 3H2" />
          <circle cx="9" cy="20" r="1" {...common} />
          <circle cx="18" cy="20" r="1" {...common} />
        </svg>
      );
  }
}

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-[1160px] px-5 md:px-6">{children}</div>;
}

function SectionKicker({ children, inverted = false }: { children: React.ReactNode; inverted?: boolean }) {
  return (
    <div className={cl("inline-flex items-center gap-2 text-xs tracking-[0.18em] uppercase", inverted ? "text-white/70" : "text-slate-500")}>
      <span className="h-[2px] w-6 rounded-full" style={{ background: YELLOW }} />
      <span>{children}</span>
    </div>
  );
}

function PillButton({
  children,
  variant = "yellow",
  className = "",
  rightIcon = true,
  onClick,
  href,
}: {
  children: React.ReactNode;
  variant?: "yellow" | "navy" | "white";
  className?: string;
  rightIcon?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const styles =
    variant === "yellow" ? { background: YELLOW, color: "white" } : variant === "navy" ? { background: NAVY, color: "white" } : { background: "white", color: NAVY };

  const content = (
    <>
      <span>{children}</span>
      {rightIcon && (
        <span className="grid h-9 w-9 place-items-center rounded-full" style={{ background: variant === "yellow" ? NAVY : YELLOW, color: variant === "yellow" ? "white" : NAVY }}>
          <Icon name="arrowUpRight" className="h-4 w-4" />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={cl(
          "inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm md:text-[15px] font-medium",
          "shadow-[0_12px_30px_rgba(0,0,0,0.15)]",
          "transition-transform duration-500 ease-in-out active:scale-[0.98] hover:translate-y-[-0.5px]",
          className
        )}
        style={styles}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cl(
        "inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm md:text-[15px] font-medium",
        "shadow-[0_12px_30px_rgba(0,0,0,0.15)]",
        "transition-transform duration-500 ease-in-out active:scale-[0.98] hover:translate-y-[-0.5px]",
        className
      )}
      style={styles}
    >
      {content}
    </button>
  );
}

function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={cl("rounded-3xl bg-white shadow-[0_20px_60px_rgba(10,20,40,0.12)]", className)} style={style}>{children}</div>;
}

export default function Page() {
  useEffect(() => { seedIfEmpty(); }, []);
  const mounted = useMounted();
  const { push } = useToast();

  useEffect(() => {
    if (!mounted) return;
    setCatalogProducts(getCatalogProducts());
    setCatalogServices(getCatalogServices());
    setGiftAmountsState(getGiftAmounts());
  }, [mounted]);
  
  const images = useMemo(() => ({
    heroBg: "https://framerusercontent.com/images/0d1IjciVK2Luo59hCJ973unq7Xo.png?height=2000&width=3006",
    heroCard: "https://framerusercontent.com/images/vONJRcDiOdig242Q3TiVm6E4.jpg?height=3000&width=3400",
  }), []);

  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [giftAmounts, setGiftAmountsState] = useState<number[]>([50000, 100000, 150000]);
  const [serviceQuoteChoice, setServiceQuoteChoice] = useState<ServiceQuoteChoice | null>(null);

  return (
    <div className="bg-white text-slate-900 -mt-[120px] md:-mt-[112px] pt-0">
      <div
        className="relative mt-0 mb-0 min-h-[100svh] md:min-h-screen overflow-clip"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.05) 100%), url(${images.heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <Container>
          <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-10 pb-14 md:pb-20 lg:pb-24 pt-[90px] sm:pt-[104px] md:pt-[124px]">
            <div className="text-white">
              <h1 className="mt-4 sm:mt-6 text-[30px] sm:text-[42px] md:text-[58px] lg:text-[66px] font-semibold leading-[1.05] tracking-[-0.03em]">
                Limpieza profesional,<br />rápida y confiable
              </h1>

              <p className="mt-8 max-w-[560px] text-white/80 text-sm md:text-base leading-relaxed">
                Hogares, oficinas, Airbnb impecables con un servicio puntual, productos de calidad y atención en cada detalle.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PillButton variant="yellow" href="#services">Cotiza ahora</PillButton>
                <PillButton variant="white" rightIcon={false} href="/login">Crear cuenta / Login</PillButton>
              </div>
            </div>

            <div className="flex lg:justify-end">
              <div className="w-full max-w-[520px]">
                <div className="rounded-[28px] p-4 md:p-6" style={{ border: `1px solid rgba(244,224,0,0.55)`, background: "rgba(255,255,255,0.10)", backdropFilter: "blur(10px)" }}>
                  <div className="overflow-hidden rounded-2xl">
                    <img src={images.heroCard} alt="" className="h-[240px] sm:h-[300px] md:h-[340px] w-full object-cover" />
                  </div>

                  <ul className="mt-4 space-y-2 text-white/90 text-sm">
                    <li>* 12% descuento primera vez</li>
                    <li>* 24% descuento clientes frecuentes</li>
                  </ul>

                  <div className="mt-5"><PillButton variant="yellow" href="#services">Cotiza ahora</PillButton></div>
                  <div className="mt-3 text-xs text-white/60">* Webpay en modo demo (simulado).</div>
                </div>
              </div>
            </div>
          </section>
        </Container>
      </div>

      <Reveal delayMs={0}><section id="quienes-somos" className="py-16 md:py-20">
        <Container>
          <SectionKicker>✨ Quiénes Somos</SectionKicker>

          <h2 className="mt-6 text-[34px] sm:text-[42px] md:text-[64px] font-light leading-[1.02] tracking-[-0.03em] text-slate-900">
            Más que limpiar, buscamos<br />brindarte tranquilidad
          </h2>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
                <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Nuestra historia</h3>
                <p className="text-slate-600 leading-relaxed">
                  En Elite Cleaning ofrecemos un servicio de limpieza profesional basado en la calidad, el detalle y la confianza. Contamos con más de 14 años de experiencia en Nueva York, lo que nos permite aplicar altos estándares en cada trabajo.
                </p>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: "14+", label: "años de experiencia" },
                    { value: "100%", label: "equipo comprometido" },
                    { value: "24/7", label: "respuesta comercial" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                      <div className="text-2xl font-semibold" style={{ color: NAVY }}>{item.value}</div>
                      <div className="mt-1 text-sm text-slate-600">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
                <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Lo que nos define</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>✓ Productos de calidad y técnicas adecuadas para cada espacio</li>
                  <li>✓ Limpieza profunda y segura garantizada</li>
                  <li>✓ Nos adaptamos a cada necesidad, entregando ambientes limpios, ordenados y agradables</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_20px_60px_rgba(10,20,40,0.10)] h-fit lg:sticky lg:top-24">
              <h3 className="text-lg font-semibold mb-4" style={{ color: NAVY }}>Tranquilidad y bienestar</h3>
              <p className="text-sm text-slate-600 mb-6">
                Utilizamos productos de calidad y técnicas adecuadas para cada espacio, garantizando una limpieza profunda y segura. Más que limpiar, buscamos brindarte tranquilidad y bienestar.
              </p>
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
                <div className="font-semibold" style={{ color: NAVY }}>Misión</div>
                <p className="mt-2 leading-relaxed">
                  Ofrecer limpieza profesional con altos estándares de calidad, detalle y confianza en cada visita.
                </p>
              </div>
              <PillButton
                variant="yellow"
                className="mt-6 w-full justify-center"
                rightIcon={false}
                href="#services"
              >
                Ver servicios →
              </PillButton>
              <p className="text-xs text-slate-500 mt-4 text-center">
                Si quieres una cotización exacta, puedes ir directo a <a href="/cotizar" className="underline hover:text-slate-700">nuestro cotizador</a>.
              </p>
            </div>
          </div>
        </Container>
      </section></Reveal>

      <Reveal delayMs={0}><section id="services" className="py-16 md:py-20 bg-[#F7F7F7]">
        <Container>
          <SectionKicker>Servicios</SectionKicker>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h2 className="text-[34px] sm:text-[42px] md:text-[64px] font-light leading-[1.02] tracking-[-0.03em] text-slate-900">
                Descubre nuestros servicios<br />y por qué lo hacemos mejor.
              </h2>
              <p className="mt-5 max-w-[680px] text-slate-600 leading-relaxed">
                Usa nuestro <b>cotizador interactivo</b> para calcular el precio exacto según tus necesidades. Incluye opciones de limpieza básica o profunda, con extras opcionales.
              </p>
            </div>
            <div className="lg:pb-2"><PillButton variant="yellow" href="/cotizar">Cotizar y pagar</PillButton></div>
          </div>

          <div className="mt-12 space-y-5">
            {catalogServices.map((s) => {
              const open = true;

              return (
                <div key={s.key} className="w-full">
                  <div className="w-full text-left">
                    <div className="rounded-[28px] px-6 md:px-10 py-7 md:py-9 bg-white shadow-[0_20px_60px_rgba(10,20,40,0.10)]">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className="text-slate-500 text-sm md:text-base w-10">{s.n}</div>
                          <div>
                            <div className="text-sm md:text-base font-medium text-slate-900">{s.title}</div>
                            <div className="text-slate-600 text-sm mt-1">{s.sub}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-slate-700"><Icon name="chevronRight" className="h-6 w-6" /></div>
                        </div>
                      </div>

                      {open && (
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[340px_1fr_auto] gap-8 items-center">
                          <div className="overflow-hidden rounded-2xl bg-slate-200">
                            <img src={s.image} alt="" className="h-44 w-full object-cover" loading="lazy" />
                          </div>
                          <div>
                            <div className="text-2xl md:text-3xl font-semibold" style={{ color: NAVY }}>
                              {s.title}
                            </div>
                            <p className="mt-3 text-slate-600 max-w-[520px]">
                              Cotiza este servicio, personaliza los detalles y agrega al carrito desde el cotizador.
                            </p>
                          </div>
                          <div className="lg:justify-self-end">
                            <PillButton
                              variant="yellow"
                              rightIcon={false}
                              onClick={() => setServiceQuoteChoice({ title: s.title, href: resolveServiceQuoteHref(s.cotizarHref, s.title) })}
                            >
                              <span className="inline-flex items-center gap-2"><Icon name="arrowUpRight" className="h-5 w-5" /> {s.cta}</span>
                            </PillButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-xs text-slate-500">
            * Usa el <a href="/cotizar" className="underline hover:text-slate-700">cotizador detallado</a> para precios exactos según tus necesidades específicas.
          </div>
        </Container>
      </section></Reveal>

      <Reveal delayMs={60}><section id="store" className="py-16 md:py-20">
        <Container>
          <SectionKicker>Tienda</SectionKicker>

          <div className="mt-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <h2 className="text-[34px] sm:text-[42px] md:text-[64px] font-light leading-[1.02] tracking-[-0.03em]">Productos listos para comprar</h2>
              <p className="mt-5 max-w-[720px] text-slate-600 leading-relaxed">
                Tus productos ya tienen imagen y nombre. Botón agrega al carrito.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:ml-auto lg:pb-2 lg:justify-end">
              <PillButton variant="white" rightIcon={false} href="/tienda">Ver más productos</PillButton>
              <PillButton variant="yellow" href="/cart">Ver carrito</PillButton>
            </div>
          </div>

          <div className="mt-10 flex gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {catalogProducts.slice(0, 6).map((p) => (
              <Card key={p.id} className="min-w-[280px] sm:min-w-[320px] lg:min-w-0 overflow-hidden">
                <div className="h-48 bg-slate-200"><img src={p.image} alt={p.name} className="h-full w-full object-cover" /></div>
                <div className="p-7">
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{p.category}</div>
                    {p.badge && <div className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-[11px] font-semibold text-blue-700">{p.badge}</div>}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-lg font-semibold mt-3" style={{ color: NAVY }}>{p.name}</div>
                    <div className="text-sm font-semibold" style={{ color: NAVY }}>{formatCLP(p.price)}</div>
                  </div>
                  <div className="mt-2 text-slate-600">{p.desc}</div>
                  <div className="mt-2 text-xs text-slate-500 grid grid-cols-1 gap-1">
                    <span>Stock: <b className={p.stock > 0 ? "text-emerald-700" : "text-red-600"}>{p.stock > 0 ? `${p.stock} unidades` : "Sin stock"}</b></span>
                    <span>Formato: <b className="text-slate-700">{p.format}</b></span>
                  </div>
                  <div className="mt-6">
                    <PillButton variant="navy" className="w-full justify-center" rightIcon={false} onClick={() => {
                      if (p.stock <= 0) {
                        push({ title: "Sin stock", message: "Este producto no tiene stock disponible por ahora.", variant: "info" });
                        return;
                      }
                      addToCart({ type: "product", name: p.name, price: p.price, qty: 1, image: p.image });
                      push({ title: "Agregado al carrito", message: "Producto agregado correctamente.", variant: "success" });
                    }}>
                      <span className="inline-flex items-center gap-2"><Icon name="cart" className="h-5 w-5" /> Agregar al carrito</span>
                    </PillButton>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {catalogProducts.length > 6 && (
            <div className="mt-6 text-sm text-slate-500">
              Mostrando 6 de {catalogProducts.length} productos. <a href="/tienda" className="font-semibold underline hover:text-slate-800">Ver catálogo completo</a>
            </div>
          )}
        </Container>
      </section></Reveal>

      <Reveal delayMs={90}><section id="giftcards" className="py-16 md:py-20 bg-[#F7F7F7]">
        <Container>
          <SectionKicker>Gift Cards</SectionKicker>

          <div className="mt-6">
            <h2 className="text-[34px] sm:text-[42px] md:text-[64px] font-light leading-[1.02] tracking-[-0.03em]">
              Gift Cards digitales<br />con código único
            </h2>
            <p className="mt-5 max-w-[720px] text-slate-600 leading-relaxed">
              Sirven para <b>productos y servicios</b>. El código único se genera automáticamente después del pago.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {giftAmounts.map((amt) => (
              <div key={amt} className="rounded-3xl overflow-hidden" style={{ background: NAVY, color: WHITE, boxShadow: "0 24px 70px rgba(10,20,40,0.18)" }}>
                <div className="p-7">
                  <div className="flex items-center justify-between">
                    <div className="text-xs tracking-[0.16em] uppercase text-white/70">Gift Card</div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: YELLOW, color: "white" }}>{formatCLP(amt)}</div>
                  </div>

                  <div className="mt-6 text-4xl font-semibold">{formatCLP(amt)}</div>
                  <div className="mt-2 text-white/75">Úsala en checkout. Código único generado después del pago.</div>

                  <div className="mt-6">
                    <PillButton variant="yellow" className="w-full justify-center" rightIcon={false} onClick={() => {
                      if (!getSessionUser()) { push({ title: "Inicia sesión", message: "Debes iniciar sesión para comprar Gift Cards.", variant: "info" }); window.location.href = "/login"; return; }
                      addToCart({ type: "giftcard", name: `Gift Card ${formatCLP(amt)}`, price: amt, qty: 1, meta: { amount: amt } });
                      push({ title: "Agregado al carrito", message: "Gift Card agregada correctamente.", variant: "success" });
                    }}>
                      Comprar
                    </PillButton>
                  </div>

                  <div className="mt-3 text-xs text-white/60">* El código se genera automáticamente después del pago.</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section></Reveal>

      <Reveal delayMs={110}><section id="faq" className="py-16 md:py-20 bg-[#F7F7F7]">
        <Container>
          <SectionKicker>FAQ</SectionKicker>

          <h2 className="mt-6 text-[34px] sm:text-[42px] md:text-[58px] font-light leading-[1.02] tracking-[-0.03em] text-slate-900">
            Preguntas frecuentes
          </h2>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { q: "¿Qué incluye la limpieza?", a: "Depende del servicio elegido. Incluye tareas base y, si quieres, extras personalizados desde el cotizador." },
              { q: "¿Cuánto demora el servicio?", a: "Varía según metraje y tipo de limpieza. Al cotizar te mostramos un rango estimado para coordinar mejor." },
              { q: "¿Ustedes llevan insumos?", a: "Sí. Nuestro equipo puede trabajar con insumos propios o con los tuyos, según tu preferencia." },
              { q: "¿Cómo se paga?", a: "Puedes pagar por Webpay (demo), Gift Card o combinando saldo Gift Card con pago normal en checkout." },
              { q: "¿Cuál es la política de cambios o reagendamiento?", a: "Puedes solicitar cambio de fecha con anticipación. Si ya está confirmado, te ayudamos a reprogramar según disponibilidad." },
              { q: "¿Cómo funcionan las Gift Cards?", a: "Se generan con código único después del pago y se pueden usar en productos y servicios hasta agotar saldo." },
            ].map((item) => (
              <div key={item.q} className="rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(10,20,40,0.08)]">
                <h3 className="text-base font-semibold" style={{ color: NAVY }}>{item.q}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section></Reveal>

      <Reveal delayMs={115}><section id="legal" className="py-16 md:py-20">
        <Container>
          <SectionKicker>Legal</SectionKicker>

          <div className="mt-6 rounded-3xl bg-white p-6 md:p-8 shadow-[0_20px_60px_rgba(10,20,40,0.08)]">
            <h2 className="text-[30px] sm:text-[38px] md:text-[46px] font-light leading-[1.04] tracking-[-0.03em]" style={{ color: NAVY }}>
              Información legal y políticas
            </h2>
            <p className="mt-4 text-sm md:text-base text-slate-600 max-w-[780px]">
              Para una compra transparente, revisa nuestras políticas antes de confirmar pedidos o servicios.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/terminos" className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Términos y condiciones</a>
              <a href="/privacidad" className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Política de privacidad</a>
              <a href="/reembolsos" className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Política de cambios y reembolsos</a>
            </div>
          </div>
        </Container>
      </section></Reveal>

      <Reveal delayMs={120}><section id="contact" className="py-16 md:py-20" style={{ background: NAVY }}>
        <Container>
          <SectionKicker inverted>Contacto</SectionKicker>

          <div className="mt-6 text-center">
            <h2 className="text-white text-[36px] sm:text-[46px] md:text-[72px] font-light leading-[1.02] tracking-[-0.03em]">
              Hablemos<br />y lo dejamos impecable
            </h2>
            <p className="mt-5 text-white/75">Compra productos, paga servicios y usa Gift Cards desde el mismo carrito.</p>

            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <PillButton variant="yellow" href="/cart">Ir al carrito</PillButton>
              <PillButton variant="white" rightIcon={false} href="/account">Ver mis pedidos</PillButton>
            </div>
          </div>

          <div className="mt-14 flex flex-col md:flex-row items-center justify-between gap-6 text-white/70">
            <div className="text-sm">© {new Date().getFullYear()} EliteCleaning. All rights reserved.</div>
            <div className="flex items-center gap-6 text-sm">
              <a className="hover:text-white transition-colors" href="#services">Servicios</a>
              <a className="hover:text-white transition-colors" href="/tienda">Tienda</a>
              <a className="hover:text-white transition-colors" href="#giftcards">Gift Cards</a>
              <a className="hover:text-white transition-colors" href="/terminos">Legal</a>
            </div>
          </div>
        </Container>
      </section></Reveal>

      {serviceQuoteChoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setServiceQuoteChoice(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-sm shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: NAVY }}>¿Cómo quieres cotizar?</h2>
            <p className="text-sm text-gray-500 mb-1">Servicio seleccionado: <span className="font-semibold text-slate-700">{serviceQuoteChoice.title}</span></p>
            <p className="text-sm text-gray-500 mb-6">Puedes continuar completando el formulario o enviarnos los detalles directamente por WhatsApp, y te responderemos a la brevedad.</p>

            <div className="space-y-3">
              <a
                href={resolveServiceQuoteHref(serviceQuoteChoice.href, serviceQuoteChoice.title)}
                className="w-full rounded-2xl px-4 py-4 text-sm font-semibold border-2 transition-colors hover:bg-gray-50 text-center block"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                Continuar cotizando en la página
              </a>

              <a
                href={(() => {
                  const msg = `Hola Elite Cleaning! Quiero cotizar el servicio: ${serviceQuoteChoice.title}.`;
                  const num = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
                  return num
                    ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
                    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-2xl px-4 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-transform hover:-translate-y-[1px]"
                style={{ background: "#25D366", color: "white" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.522 5.845L.057 23.57a.75.75 0 0 0 .906.94l5.934-1.554A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.713 9.713 0 0 1-4.953-1.355l-.355-.21-3.523.924.937-3.417-.231-.371A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
                Cotizar por WhatsApp
              </a>
            </div>

            <button
              onClick={() => setServiceQuoteChoice(null)}
              className="mt-5 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <WhatsAppFloat />
    </div>
  );
}
