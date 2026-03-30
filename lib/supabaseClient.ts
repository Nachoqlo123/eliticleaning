import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _supabase: SupabaseClient | null = null;

/**
 * Lazy Supabase client — only created at runtime, never during build/prerender.
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[Supabase] Missing env vars:", {
        url: !!SUPABASE_URL,
        key: !!SUPABASE_ANON_KEY,
      });
      throw new Error("Supabase environment variables are not configured.");
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

/* ------------------------------------------------------------------ */
/*  Auth                                                               */
/* ------------------------------------------------------------------ */

export async function supaSignUp(email: string, password: string) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    console.error("[Supabase] signUp error:", error);
    throw new Error(error.message);
  }

  // Insert profile row in "users" table
  if (data.user) {
    const { error: profileErr } = await sb.from("users").insert({
      id: data.user.id,
      email: data.user.email,
      role: "client",
    });
    if (profileErr) {
      console.error("[Supabase] users insert error:", profileErr);
      // Non-fatal: auth succeeded even if profile insert failed
    }
  }

  console.log("[Supabase] signUp success:", data.user?.id);
  return data;
}

export async function supaSignIn(email: string, password: string) {
  const sb = getSupabase();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[Supabase] signIn error:", error);
    throw new Error(error.message);
  }
  console.log("[Supabase] signIn success:", data.user?.id);
  return data;
}

export async function supaSignOut() {
  const sb = getSupabase();
  const { error } = await sb.auth.signOut();
  if (error) console.error("[Supabase] signOut error:", error);
}

export async function supaGetUser() {
  const sb = getSupabase();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error) {
    console.error("[Supabase] getUser error:", error);
    return null;
  }
  return user;
}

export async function supaGetSession() {
  const sb = getSupabase();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

/** Get user profile (role, etc.) from "users" table */
export async function supaGetProfile(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) console.error("[Supabase] getProfile error:", error);
  return data;
}

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

export async function supaInsertOrder(order: {
  user_id: string;
  items: any[];
  subtotal: number;
  discount_giftcard: number;
  total_paid: number;
  payment_method: string;
  payment_ref: string;
  status: string;
  kind: string;
}) {
  const sb = getSupabase();
  console.log("[Supabase] Inserting order...", order);
  const { data, error } = await sb
    .from("orders")
    .insert({
      ...order,
      items: JSON.stringify(order.items),
    })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] insertOrder error:", error);
    throw new Error(error.message);
  }
  console.log("[Supabase] Order inserted:", data);
  return data;
}

export async function supaGetOrders(userId: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase] getOrders error:", error);
    return [];
  }
  // Parse items back from JSON string
  return (data ?? []).map((o: any) => ({
    ...o,
    items: typeof o.items === "string" ? JSON.parse(o.items) : o.items,
  }));
}

export async function supaUpdateOrderStatus(orderId: string, status: string) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    console.error("[Supabase] updateOrderStatus error:", error);
    throw new Error(error.message);
  }
  console.log("[Supabase] Order status updated:", data);
  return data;
}
