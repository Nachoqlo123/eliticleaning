import { nanoid } from "nanoid";
import { supaSignOut } from "@/lib/supabaseClient";

export type Role = "client" | "admin";
export type PaymentMethod = "webpay" | "transfer" | "giftcard";

export type OrderStatusProduct = "Pagado" | "Enviado" | "Recepcionado";
export type OrderStatusService = "Pagado" | "Agendado" | "En servicio" | "Finalizado";

export type ItemType = "product" | "service" | "giftcard";

export type CartItem = {
  id: string;
  type: ItemType;
  name: string;
  price: number;
  qty: number;
  meta?: Record<string, any>;
  image?: string;
};

export type User = {
  id: string;
  email: string;
  password: string; // MVP demo
  role: Role;
};

export type GiftCard = {
  code: string;
  initialAmount: number;
  balance: number;
  status: "active" | "used" | "disabled";
  createdAt: string;
  ownerUserId?: string;
};

export type Order = {
  id: string;
  userId: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discountGiftCard: number;
  totalPaid: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string; // tx id / comprobante
  giftCardCodeUsed?: string;
  status: OrderStatusProduct | OrderStatusService;
  kind: "product" | "service" | "mixed";
};

export type ServiceShift = "AM" | "PM";
export type ServiceSlotStatus = "reservado" | "ocupado";
export type ServiceSlotStatusMap = Record<string, Partial<Record<ServiceShift, ServiceSlotStatus>>>;

const KEY = {
  users: "ec_users_v1",
  session: "ec_session_v1",
  cart: "ec_cart_v1",
  orders: "ec_orders_v1",
  giftcards: "ec_giftcards_v1",
  serviceSlots: "ec_service_slots_v1",
};

function read<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

/* ---------- Auth (MVP demo) ---------- */
export function seedIfEmpty() {
  // Admin demo: admin@elite.cl / 1234
  const users = read<User[]>(KEY.users, []);
  if (users.length === 0) {
    write(KEY.users, [
      { id: "u_admin", email: "admin@elite.cl", password: "1234", role: "admin" },
    ]);
  }
}

export function register(email: string, password: string) {
  const users = read<User[]>(KEY.users, []);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Este correo ya está registrado.");
  }
  const user: User = { id: `u_${nanoid(10)}`, email, password, role: "client" };
  users.push(user);
  write(KEY.users, users);
  write(KEY.session, { userId: user.id });
  return user;
}

export function login(email: string, password: string) {
  const users = read<User[]>(KEY.users, []);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) throw new Error("Credenciales incorrectas.");
  write(KEY.session, { userId: user.id });
  return user;
}

export function logout() {
  write(KEY.session, null);
  // Fire-and-forget Supabase signOut (async, but we don't wait)
  supaSignOut().catch(() => {});
}

export function getSessionUser(): User | null {
  const sess = read<{ userId: string } | null>(KEY.session, null);
  if (!sess?.userId) return null;
  const users = read<User[]>(KEY.users, []);
  return users.find((u) => u.id === sess.userId) ?? null;
}

// helper to look up arbitrary user by ID (useful for admin views)
export function getUserById(id: string): User | undefined {
  const users = read<User[]>(KEY.users, []);
  return users.find((u) => u.id === id);
}

/* ---------- Cart ---------- */
export function getCart(): CartItem[] {
  return read<CartItem[]>(KEY.cart, []);
}
export function setCart(items: CartItem[]) {
  write(KEY.cart, items);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ec:cart-updated"));
  }
}
export function addToCart(item: Omit<CartItem, "id">) {
  const cart = getCart();
  if (item.type === "service") {
    cart.push({ ...item, id: `ci_${nanoid(10)}` });
  } else {
    const same = cart.find((c) => c.type === item.type && c.name === item.name && c.price === item.price);
    if (same) same.qty += item.qty;
    else cart.push({ ...item, id: `ci_${nanoid(10)}` });
  }
  setCart(cart);
}
export function removeFromCart(id: string) {
  setCart(getCart().filter((x) => x.id !== id));
}
export function updateCartItemQuantity(id: string, newQty: number) {
  const cart = getCart();
  const item = cart.find((x) => x.id === id);
  if (item) {
    item.qty = Math.max(1, newQty);
    setCart(cart);
  }
}
export function clearCart() {
  setCart([]);
}

/* ---------- Gift Cards ---------- */
export function generateGiftCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 })
      .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
      .join("");
  return `EC-${part()}-${part()}-${part()}`;
}

export function getGiftCards(): GiftCard[] {
  return read<GiftCard[]>(KEY.giftcards, []);
}

export function createGiftCard(amount: number, ownerUserId?: string) {
  const all = getGiftCards();
  let code = generateGiftCode();
  while (all.some((g) => g.code === code)) code = generateGiftCode();

  const gc: GiftCard = {
    code,
    initialAmount: amount,
    balance: amount,
    status: "active",
    createdAt: new Date().toISOString(),
    ownerUserId,
  };
  all.push(gc);
  write(KEY.giftcards, all);
  return gc;
}

export function validateGiftCard(code: string) {
  const all = getGiftCards();
  const gc = all.find((g) => g.code.toUpperCase() === code.toUpperCase());
  if (!gc) return { ok: false, reason: "Código no existe." as const };
  if (gc.status !== "active") return { ok: false, reason: "Gift Card no está activa." as const };
  if (gc.balance <= 0) return { ok: false, reason: "Gift Card sin saldo." as const };
  return { ok: true, gift: gc as GiftCard };
}

export function spendGiftCard(code: string, amount: number) {
  const all = getGiftCards();
  const idx = all.findIndex((g) => g.code.toUpperCase() === code.toUpperCase());
  if (idx === -1) throw new Error("Gift Card no existe.");
  const gc = all[idx];
  if (gc.status !== "active") throw new Error("Gift Card no está activa.");
  const spend = Math.min(amount, gc.balance);
  gc.balance -= spend;
  if (gc.balance <= 0) {
    gc.balance = 0;
    gc.status = "used";
  }
  all[idx] = gc;
  write(KEY.giftcards, all);
  return { spent: spend, updated: gc };
}

/* ---------- Orders ---------- */
export function getOrders(): Order[] {
  return read<Order[]>(KEY.orders, []);
}
export function setOrders(o: Order[]) {
  write(KEY.orders, o);
}

export function createOrder(args: {
  userId: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  giftCardCode?: string;
  discountGiftCard: number;
  totalPaid: number;
  status: Order["status"];
}) {
  const subtotal = args.items.reduce((a, it) => a + it.price * it.qty, 0);

  const kind: Order["kind"] =
    args.items.some((i) => i.type === "product") && args.items.some((i) => i.type === "service")
      ? "mixed"
      : args.items.some((i) => i.type === "service")
      ? "service"
      : "product";

  const order: Order = {
    id: `ord_${nanoid(10)}`,
    userId: args.userId,
    createdAt: new Date().toISOString(),
    items: args.items,
    subtotal,
    discountGiftCard: args.discountGiftCard,
    totalPaid: args.totalPaid,
    paymentMethod: args.paymentMethod,
    paymentRef: args.paymentRef,
    giftCardCodeUsed: args.giftCardCode,
    status: args.status,
    kind,
  };

  const all = getOrders();
  all.unshift(order);
  setOrders(all);
  return order;
}

export function updateOrderStatus(orderId: string, status: Order["status"]) {
  const all = getOrders();
  const idx = all.findIndex((o) => o.id === orderId);
  if (idx === -1) throw new Error("Pedido no existe.");
  all[idx] = { ...all[idx], status };
  setOrders(all);
  return all[idx];
}

function isValidServiceDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidServiceShift(value: unknown): value is ServiceShift {
  return value === "AM" || value === "PM";
}

function isValidServiceSlotStatus(value: unknown): value is ServiceSlotStatus {
  return value === "reservado" || value === "ocupado";
}

function readServiceSlotStatusMap(): ServiceSlotStatusMap {
  const raw = read<Record<string, Record<string, string>>>(KEY.serviceSlots, {});
  const normalized: ServiceSlotStatusMap = {};

  for (const [dateKey, shifts] of Object.entries(raw)) {
    if (!isValidServiceDateKey(dateKey) || !shifts || typeof shifts !== "object") continue;

    const slotState: Partial<Record<ServiceShift, ServiceSlotStatus>> = {};
    for (const [shift, status] of Object.entries(shifts)) {
      if (isValidServiceShift(shift) && isValidServiceSlotStatus(status)) {
        slotState[shift] = status;
      }
    }

    if (slotState.AM || slotState.PM) normalized[dateKey] = slotState;
  }

  return normalized;
}

function writeServiceSlotStatusMap(map: ServiceSlotStatusMap) {
  write(KEY.serviceSlots, map);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("ec:service-slots-updated"));
  }
}

export function getServiceSlotStatuses() {
  return readServiceSlotStatusMap();
}

export function getServiceSlotStatus(serviceDate: string, serviceShift: ServiceShift) {
  if (!isValidServiceDateKey(serviceDate)) return null;
  return getServiceSlotStatuses()[serviceDate]?.[serviceShift] ?? null;
}

export function isServiceSlotUnavailable(serviceDate: string, serviceShift: ServiceShift) {
  return getServiceSlotStatus(serviceDate, serviceShift) !== null;
}

export function setServiceSlotStatus(serviceDate: string, serviceShift: ServiceShift, status: ServiceSlotStatus | null) {
  if (!isValidServiceDateKey(serviceDate) || !isValidServiceShift(serviceShift)) {
    throw new Error("Fecha o bloque horario inválido.");
  }

  const current = readServiceSlotStatusMap();
  const next: ServiceSlotStatusMap = { ...current };
  const dayState = { ...(next[serviceDate] ?? {}) };

  if (status === null) {
    delete dayState[serviceShift];
  } else {
    dayState[serviceShift] = status;
  }

  if (!dayState.AM && !dayState.PM) {
    delete next[serviceDate];
  } else {
    next[serviceDate] = dayState;
  }

  writeServiceSlotStatusMap(next);
}

export function getOccupiedServiceDates() {
  return Object.keys(getServiceSlotStatuses()).sort();
}

export function isServiceDateOccupied(serviceDate: string) {
  return getOccupiedServiceDates().includes(serviceDate);
}

/* ---------- Helpers ---------- */
export function formatCLP(n: number) {
  const s = Math.round(n).toString();
  const withDots = s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$${withDots}`;
}

/* ---------- Catalog ---------- */
export type CatalogProduct = {
  id: string;
  name: string;
  desc: string;
  price: number;
  image: string;
  category: string;
  badge: "destacado" | "nuevo" | "mas-vendido" | "recomendado" | "";
  stock: number;
  format: string;
  recommendedUse: string;
  surface: string;
};

export type CatalogService = {
  id: string;
  key: string;
  n: string;
  title: string;
  sub: string;
  image: string;
  cotizarHref: string;
  cta: string;
};

const CAT = {
  products: "ec_catalog_products_v1",
  services: "ec_catalog_services_v1",
  giftAmounts: "ec_gift_amounts_v1",
};

export const DEFAULT_CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "cp_1",
    name: "Pack Madera (Weiman + Lithofin)",
    desc: "Limpieza y cuidado de pisos de madera / parquet.",
    price: 19990,
    image: "/products/wood-pack.jpeg",
    category: "Pisos",
    badge: "mas-vendido",
    stock: 18,
    format: "Pack doble",
    recommendedUse: "Mantenimiento semanal",
    surface: "Madera y parquet",
  },
  {
    id: "cp_2",
    name: "Super Wash 5L (Limpia pisos)",
    desc: "Para cerámica, madera y pisos flotantes. Formato 5 litros.",
    price: 12990,
    image: "/products/super-wash-5l.jpeg",
    category: "Pisos",
    badge: "destacado",
    stock: 24,
    format: "Bidón 5 litros",
    recommendedUse: "Limpieza frecuente",
    surface: "Cerámica, porcelanato y flotante",
  },
  {
    id: "cp_3",
    name: "Pack Antigrasa (Astonish Grease Lift + cepillo)",
    desc: "Desengrasante potente para cocina y superficies difíciles.",
    price: 10990,
    image: "/products/astonish-grease-pack.jpeg",
    category: "Cocina",
    badge: "recomendado",
    stock: 15,
    format: "Spray + cepillo",
    recommendedUse: "Limpieza profunda",
    surface: "Cocinas y encimeras",
  },
  {
    id: "cp_4",
    name: "Pack Hongo Stop (Astonish Mould & Mildew + cepillo)",
    desc: "Removedor de moho/hongos ideal para baños y juntas.",
    price: 10990,
    image: "/products/astonish-mould-pack.jpeg",
    category: "Baño",
    badge: "nuevo",
    stock: 12,
    format: "Spray + cepillo",
    recommendedUse: "Aplicación puntual",
    surface: "Baños, juntas y silicona",
  },
  {
    id: "cp_5",
    name: "Sprayway Glass Cleaner (Limpiavidrios)",
    desc: "Aerosol para vidrios, espejos y superficies brillantes.",
    price: 8990,
    image: "/products/sprayway-glass.jpeg",
    category: "Vidrios",
    badge: "",
    stock: 30,
    format: "Aerosol",
    recommendedUse: "Terminaciones",
    surface: "Vidrios y espejos",
  },
];

export const DEFAULT_CATALOG_SERVICES: CatalogService[] = [
  { id: "cs_1", key: "home", n: "01", title: "Limpieza Hogar", sub: "casa / departamento, mantenimiento o profunda", image: "https://framerusercontent.com/images/nxZWV7dsSDsXHNjzJPWsLuF5Jyc.jpg?height=2001&width=3000", cotizarHref: "/cotizar?servicio=casa", cta: "Cotizar servicio hogar" },
  { id: "cs_2", key: "workspace", n: "02", title: "Limpieza Oficina", sub: "pensado para equipos y espacios de trabajo", image: "https://framerusercontent.com/images/CKQrVU7pRz5weRzYxXucpu2vy8.jpg?height=2000&width=1333", cotizarHref: "/cotizar?servicio=oficina", cta: "Cotizar servicio oficina" },
  { id: "cs_3", key: "youngAdult", n: "03", title: "Plan Smart Living", sub: "ideal para estudiantes y primeros departamentos · ~2 horas", image: "/products/plan-adulto-joven.jpg", cotizarHref: "/cotizar/adulto-joven", cta: "Cotizar Plan Smart Living" },
  { id: "cs_4", key: "airbnb", n: "04", title: "Plan Airbnb", sub: "limpieza para recambios y check-in de huéspedes", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=80", cotizarHref: "/cotizar/airbnb", cta: "Cotizar Plan Airbnb" },
];

export const DEFAULT_GIFT_AMOUNTS = [50000, 100000, 150000];

type PartialCatalogProduct = Omit<CatalogProduct, "category" | "badge" | "stock" | "format" | "recommendedUse" | "surface"> & {
  category?: string;
  badge?: CatalogProduct["badge"];
  stock?: number;
  format?: string;
  recommendedUse?: string;
  surface?: string;
};

function normalizeCatalogProduct(product: CatalogProduct | PartialCatalogProduct): CatalogProduct {
  const stock = Number(product.stock ?? 0);
  return {
    ...product,
    category: (product.category && product.category.trim()) || "General",
    badge: product.badge ?? "",
    stock: Number.isFinite(stock) ? Math.max(0, Math.round(stock)) : 0,
    format: (product.format && product.format.trim()) || "Formato estándar",
    recommendedUse: (product.recommendedUse && product.recommendedUse.trim()) || "Uso general",
    surface: (product.surface && product.surface.trim()) || "Superficies múltiples",
  };
}

export function getCatalogProducts(): CatalogProduct[] {
  const stored = read<Array<CatalogProduct | PartialCatalogProduct> | null>(CAT.products, null);
  const base = stored ?? DEFAULT_CATALOG_PRODUCTS;
  return base.map(normalizeCatalogProduct);
}
export function saveCatalogProduct(p: CatalogProduct) {
  const all = getCatalogProducts();
  const idx = all.findIndex((x) => x.id === p.id);
  const normalized = normalizeCatalogProduct(p);
  if (idx === -1) all.push(normalized);
  else all[idx] = normalized;
  write(CAT.products, all);
}
export function deleteCatalogProduct(id: string) {
  write(CAT.products, getCatalogProducts().filter((x) => x.id !== id));
}

export function getCatalogProductById(id: string): CatalogProduct | null {
  return getCatalogProducts().find((x) => x.id === id) ?? null;
}

export function getCatalogServices(): CatalogService[] {
  const stored = read<CatalogService[] | null>(CAT.services, null);
  if (!stored) return DEFAULT_CATALOG_SERVICES;

  const merged = [...stored];
  const existingIds = new Set(stored.map((s) => s.id));
  const missingDefaults = DEFAULT_CATALOG_SERVICES.filter((s) => !existingIds.has(s.id));
  if (missingDefaults.length > 0) {
    merged.push(...missingDefaults);
    write(CAT.services, merged);
  }

  return merged;
}
export function saveCatalogService(s: CatalogService) {
  const all = getCatalogServices();
  const idx = all.findIndex((x) => x.id === s.id);
  if (idx === -1) all.push(s);
  else all[idx] = s;
  write(CAT.services, all);
}
export function deleteCatalogService(id: string) {
  write(CAT.services, getCatalogServices().filter((x) => x.id !== id));
}

export function getGiftAmounts(): number[] {
  return read<number[] | null>(CAT.giftAmounts, null) ?? DEFAULT_GIFT_AMOUNTS;
}
export function setGiftAmounts(amounts: number[]) {
  write(CAT.giftAmounts, amounts);
}

export function disableGiftCard(code: string) {
  const all = getGiftCards();
  const idx = all.findIndex((g) => g.code === code);
  if (idx !== -1) {
    all[idx].status = "disabled";
    write(KEY.giftcards, all);
  }
}
