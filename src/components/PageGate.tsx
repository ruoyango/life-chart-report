'use client';

import { type ReactNode } from "react";
import { useAccessLevel } from "./AccessProvider";
import { useStartSubscribe } from "./useStartSubscribe";

function LockIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Whole-page gate for the computed pages (合数 / 择日 / 电话号码). These have no
// server-gated data, so direct-URL access is blocked here at the UI level: a user
// below the required tier sees an upsell instead of the page.
export function PageGate({ minLevel, children }: { minLevel: number; children: ReactNode }) {
  const { level, loading } = useAccessLevel();
  const startSubscribe = useStartSubscribe();

  // Don't flash either the page or the lock until we know the tier.
  if (loading) {
    return <div className="flex w-full justify-center py-20 text-sm text-zinc-400">加载中…</div>;
  }

  if (level >= minLevel) return <>{children}</>;

  const isSubscriber = level >= 1;
  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-amber-200/70 bg-white p-8 text-center shadow-sm ring-1 ring-amber-100/50">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <LockIcon />
      </span>
      <h2 className="text-lg font-bold text-amber-900">
        {isSubscriber ? "升级订阅以使用此页面" : "订阅以使用此页面"}
      </h2>
      <p className="text-sm text-zinc-600">
        此功能需要更高的订阅方案，{isSubscriber ? "升级后即可解锁。" : "订阅会员后即可解锁。"}
      </p>
      <button
        type="button"
        onClick={startSubscribe}
        className="rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
      >
        {isSubscriber ? "升级订阅" : "订阅"}
      </button>
    </div>
  );
}
