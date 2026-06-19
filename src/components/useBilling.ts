'use client';

import { useState } from "react";
import { supabase } from "../lib/supabase";

// Calls the billing Edge Functions and redirects the browser to the Stripe-hosted
// page they return (Checkout for new subs, Customer Portal for changes).
export function useBilling() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async (fn: string, body: Record<string, unknown>) => {
    if (!supabase) {
      setError("支付服务尚未配置。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const base = window.location.origin + window.location.pathname;
      const { data, error: fnError } = await supabase.functions.invoke<{ url: string }>(fn, {
        body: {
          ...body,
          returnUrl: base,
          successUrl: `${base}?checkout=success`,
          cancelUrl: `${base}?checkout=cancelled`,
        },
      });
      if (fnError) throw fnError;
      if (!data?.url) throw new Error("未收到跳转链接。");
      window.location.href = data.url; // leave the SPA for Stripe
    } catch (e) {
      let msg = e instanceof Error ? e.message : "操作失败，请稍后再试。";
      const ctx = (e as { context?: Response })?.context;
      if (ctx && typeof ctx.json === "function") {
        try {
          const b = await ctx.json();
          if (b?.error) msg = b.error;
        } catch {
          /* not JSON — keep generic */
        }
      }
      setError(msg);
      setBusy(false); // on success we've already navigated away
    }
  };

  return {
    busy,
    error,
    startCheckout: (tier: number) => go("create-checkout", { tier }),
    openPortal: () => go("customer-portal", {}),
  };
}
