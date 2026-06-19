'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useAccessLevel } from "./AccessProvider";
import { tierName } from "../lib/tiers";

// Account control fixed in the top-right corner (left of the theme toggle).
// Logged out → a 登录 button that opens the auth modal.
// Logged in  → an avatar (email initial); click for a dropdown with the email,
//              current subscription tier, a 管理订阅 link, and a 登出 button.
export function AccountMenu() {
  const { user, openModal, signOut } = useAuth();
  const { level } = useAccessLevel();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside-click / Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <div ref={ref} className="fixed right-16 top-3 z-50 print:hidden">
      {user ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="账户"
            title={user.email ?? "账户"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-amber-500 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600 hover:shadow"
          >
            {initial}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl border border-amber-200/70 bg-white p-3 shadow-lg ring-1 ring-amber-100/50">
              <p className="mb-0.5 text-xs text-zinc-500">已登录</p>
              <p
                className="truncate text-sm font-medium text-amber-900"
                title={user.email ?? ""}
              >
                {user.email}
              </p>

              <div className="my-3 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                <span className="text-xs text-zinc-500">当前方案</span>
                <span className="text-sm font-semibold text-amber-900">{tierName(level)}</span>
              </div>

              <Link
                href="/subscription"
                onClick={() => setOpen(false)}
                className="mb-2 block w-full rounded-lg border border-amber-300 px-3 py-2 text-center text-sm font-semibold text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
              >
                管理订阅
              </Link>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                登出
              </button>
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => openModal()}
          className="flex h-10 items-center justify-center rounded-full border border-amber-200 bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow"
        >
          登录
        </button>
      )}
    </div>
  );
}
