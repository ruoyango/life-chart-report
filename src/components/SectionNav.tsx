'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccessLevel } from "./AccessProvider";
import { useStartSubscribe } from "./useStartSubscribe";

// Pages (top-level nav) and the in-page section anchors for each.
// minLevel = subscription tier needed to open the page (0 free · 1 standard · 2 premium).
const PAGES = [
  {
    href: "/",
    label: "个人蓝图",
    minLevel: 0,
    sections: [
      { id: "sec-input", label: "核心资料" },
      { id: "sec-chart", label: "个人蓝图" },
      { id: "sec-summary", label: "总体故事" },
      { id: "sec-story", label: "数字故事" },
      { id: "sec-hidden", label: "隐藏性格" },
      { id: "sec-ability", label: "能力分布" },
      { id: "sec-health", label: "健康关系" },
      { id: "sec-career", label: "事业选择" },
      { id: "sec-directions", label: "最好方向" },
    ],
  },
  {
    href: "/heshu",
    label: "合数",
    minLevel: 1,
    sections: [
      { id: "sec-heshu", label: "合数" },
      { id: "sec-heshu-charts", label: "个人蓝图" },
    ],
  },
  {
    href: "/zeri",
    label: "择日",
    minLevel: 1,
    sections: [
      { id: "sec-zeri", label: "择日" },
      { id: "sec-zeri-combo", label: "择日组合" },
    ],
  },
  {
    href: "/planets",
    label: "电话号码",
    minLevel: 2,
    sections: [
      { id: "sec-input", label: "核心资料" },
      { id: "sec-planets-life", label: "人生蓝图" },
      { id: "sec-planets-ic", label: "身份证号码" },
      { id: "sec-planets-total", label: "人生蓝图 + 身份证八大行星总数" },
      { id: "sec-planets-phone", label: "电话号码八大行星" },
    ],
  }
];

export function SectionNav() {
  const [open, setOpen] = useState(false);
  // The locked tab whose upsell popup is showing, with its on-screen position.
  const [lockPopup, setLockPopup] = useState<{ href: string; top: number; left: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  // The report page we're on (if any). On non-report pages (e.g. /subscription)
  // there's no in-page section list to show.
  const currentPage = PAGES.find((p) => p.href === pathname);
  const { level, loading } = useAccessLevel();
  const startSubscribe = useStartSubscribe();
  // tier 1+ → "upgrade"; tier 0 → "subscribe".
  const isSubscriber = level >= 1;

  // Drop the popup whenever we navigate.
  useEffect(() => setLockPopup(null), [pathname]);

  // Collapse when clicking outside the nav — but not when dragging (e.g. text
  // selection), detected by how far the pointer moved between press and release.
  useEffect(() => {
    if (!open) return;
    let startX = 0;
    let startY = 0;
    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
      startY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (moved > 6) return; // treat as a drag, not a click
      if (navRef.current?.contains(e.target as Node)) return; // inside the nav
      setOpen(false);
      setLockPopup(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerup", onUp);
    };
  }, [open]);

  // Toggle the upsell popup for a locked tab, anchored to the right of it.
  const onLockedClick = (href: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setLockPopup((cur) =>
      cur?.href === href ? null : { href, top: rect.top, left: rect.right + 8 },
    );
  };

  return (
    <nav ref={navRef} className="fixed left-0 top-24 z-40">
      {open ? (
        <div className="ml-2 max-h-[80vh] w-44 overflow-y-auto rounded-xl border border-amber-200/70 bg-white/85 p-3 shadow-lg ring-1 ring-amber-100/50 backdrop-blur">
          {/* Page links — pages above the user's tier are clickable and pop an upsell. */}
          <div className="mb-3 space-y-1">
            {PAGES.map((p) => {
              // Treat "still loading" as unlocked so paying users don't see a
              // flash of locked links on every page load.
              const locked = !loading && level < (p.minLevel ?? 0);
              if (locked) {
                return (
                  <button
                    key={p.href}
                    type="button"
                    onClick={(e) => onLockedClick(p.href, e)}
                    title="订阅后解锁"
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-amber-100/60 ${
                      lockPopup?.href === p.href ? "bg-amber-100/60 text-amber-800/70" : "text-amber-800/40"
                    }`}
                  >
                    <span>{p.label}</span>
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </button>
                );
              }
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  onClick={() => setLockPopup(null)}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    p.href === pathname
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              {currentPage ? "本页目录" : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setLockPopup(null);
              }}
              aria-label="收起目录"
              title="收起目录"
              className="flex h-6 w-6 items-center justify-center rounded-md text-amber-600 transition hover:bg-amber-100 hover:text-amber-900"
            >
              «
            </button>
          </div>
          {currentPage && (
            <ul className="space-y-1 border-l-2 border-amber-200 pl-3">
              {currentPage.sections.map((item, i) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-center gap-2 py-1 text-sm text-amber-700/70 transition hover:font-semibold hover:text-amber-900"
                  >
                    <span className="font-mono text-xs tabular-nums text-amber-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="展开目录"
          title="展开目录"
          className="flex h-12 w-9 items-center justify-center rounded-r-xl border border-l-0 border-amber-200/70 bg-white/85 text-amber-700 shadow-md ring-1 ring-amber-100/50 backdrop-blur transition hover:bg-amber-100 hover:text-amber-900"
        >
          ☰
        </button>
      )}

      {/* Upsell popup for a locked tab — fixed, anchored to the right of the tab. */}
      {open && lockPopup && (
        <div
          className="fixed z-50 w-56 rounded-xl border border-amber-200/70 bg-white p-3 shadow-lg ring-1 ring-amber-100/50"
          style={{ top: lockPopup.top, left: lockPopup.left }}
        >
          <p className="mb-3 text-sm font-medium text-amber-900">
            {isSubscriber ? "升级订阅以使用此页面" : "订阅以使用此页面"}
          </p>
          <button
            type="button"
            onClick={() => {
              setLockPopup(null);
              startSubscribe();
            }}
            className="w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            {isSubscriber ? "升级订阅" : "订阅"}
          </button>
        </div>
      )}
    </nav>
  );
}
