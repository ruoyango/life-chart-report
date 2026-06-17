'use client';

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

// Account control fixed in the top-right corner (left of the theme toggle).
// Logged out → a 登录 button that opens the auth modal.
// Logged in  → an avatar (email initial); click for a dropdown with the email
//              and a 登出 button.
export function AccountMenu() {
  const { user, openModal, signOut } = useAuth();
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
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-amber-200/70 bg-white p-3 shadow-lg ring-1 ring-amber-100/50">
              <p className="mb-0.5 text-xs text-zinc-500">已登录</p>
              <p
                className="mb-3 truncate text-sm font-medium text-amber-900"
                title={user.email ?? ""}
              >
                {user.email}
              </p>
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
          onClick={openModal}
          className="flex h-10 items-center justify-center rounded-full border border-amber-200 bg-amber-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 hover:shadow"
        >
          登录
        </button>
      )}
    </div>
  );
}
