'use client';

import { type ReactNode } from "react";
import { useAccessLevel } from "./AccessProvider";
import { useStartSubscribe } from "./useStartSubscribe";

// Placeholder shown in place of every gated interpretation line when the user
// isn't subscribed. The values under the fog are faked (0 / green / this text)
// so Inspect can't reveal the real ones — the fog is just the visual treatment.
export const LOCKED_LINE = "登录后查看";

function LockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Whether the current user is below the given tier. "Loading" counts as locked
// so a non-subscriber never briefly renders real values before the level loads.
export function useGate(minLevel: number) {
  const { level, loading } = useAccessLevel();
  return { locked: loading || level < minLevel, loading };
}

// Upsell shown above a locked section. The button is a no-op for now — Phase 4
// wires it to Stripe checkout.
function LockBanner() {
  const startSubscribe = useStartSubscribe();
  return (
    <div className="mb-4 flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <LockIcon />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-900">订阅后解锁完整解析</p>
          <p className="mt-0.5 text-sm text-zinc-600">成为订阅会员，即可查看此部分的详细内容。</p>
        </div>
      </div>
      <button
        type="button"
        onClick={startSubscribe}
        className="shrink-0 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
      >
        订阅 Subscribe
      </button>
    </div>
  );
}

// Wraps a locked section body. When locked: shows the upsell banner, then the
// (already-faked) content behind a non-scrollable, non-selectable fog. When
// unlocked: renders the children unchanged.
export function LockedShell({
  locked,
  children,
  previewMaxH = "16rem",
}: {
  locked: boolean;
  children: ReactNode;
  previewMaxH?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <>
      <LockBanner />
      <div className="overflow-hidden" style={{ maxHeight: previewMaxH }}>
        <div
          className="pointer-events-none select-none blur-[5px]"
          aria-hidden="true"
          style={{
            maskImage: "linear-gradient(to bottom, black 0%, black 28%, transparent 92%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 28%, transparent 92%)",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
