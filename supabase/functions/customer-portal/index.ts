// Supabase Edge Function (Deno) — opens the Stripe Customer Portal so an existing
// subscriber can upgrade, downgrade, or cancel. Stripe hosts the portal and
// emits webhooks back to stripe-webhook, which updates the tier.
//
// Secret: STRIPE_SECRET_KEY. (The portal must be enabled in the Stripe dashboard:
//   Settings → Billing → Customer portal.)
// Deploy: supabase functions deploy customer-portal

import Stripe from "npm:stripe@^17";
import { createClient } from "npm:@supabase/supabase-js@^2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const {
      data: { user },
    } = await supa.auth.getUser(token);
    if (!user) return json({ error: "未授权，请先登录。" }, 401);

    const { returnUrl } = (await req.json()) as { returnUrl?: string };

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row } = await admin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!row?.stripe_customer_id) return json({ error: "没有可管理的订阅。" }, 400);

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: returnUrl ?? undefined,
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
