'use client';

import { useAuth } from "../../components/AuthProvider";
import { useAccessLevel } from "../../components/AccessProvider";
import { TIERS } from "../../lib/tiers";

export default function SubscriptionPage() {
  const { user, openModal } = useAuth();
  const { level, loading } = useAccessLevel();

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-amber-900">订阅方案</h2>
        <p className="mt-2 text-zinc-600">选择适合您的方案，解锁更深入的命盘解析。</p>
        {!user && (
          <p className="mt-2 text-sm text-amber-700">
            请先
            <button
              type="button"
              onClick={() => openModal("/subscription")}
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              登录或注册
            </button>
            以订阅。
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isCurrent = !!user && !loading && level === tier.level;
          return (
            <div
              key={tier.level}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ring-1 transition ${
                isCurrent
                  ? "border-amber-400 ring-amber-200"
                  : "border-amber-200/70 ring-amber-100/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xl font-bold text-amber-900">{tier.name}</h3>
                {isCurrent && (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
                    当前方案
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{tier.tagline}</p>
              <p className="mt-4 text-2xl font-bold text-amber-900">{tier.price}</p>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-0.5 font-bold text-amber-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {!user ? (
                  tier.level === 0 ? (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-400"
                    >
                      免费方案
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openModal("/subscription")}
                      className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                    >
                      登录后订阅
                    </button>
                  )
                ) : isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-700"
                  >
                    当前方案
                  </button>
                ) : tier.level > level ? (
                  <button
                    type="button"
                    // TODO (Phase 4): start Stripe checkout for this tier.
                    onClick={() => {}}
                    className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
                  >
                    {level === 0 ? "订阅" : "升级"}
                  </button>
                ) : tier.level === 0 ? (
                  <button
                    type="button"
                    // TODO (Phase 4): cancel via the Stripe customer portal.
                    onClick={() => {}}
                    className="w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    取消订阅
                  </button>
                ) : (
                  <button
                    type="button"
                    // TODO (Phase 4): downgrade via the Stripe customer portal.
                    onClick={() => {}}
                    className="w-full rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                  >
                    降级到{tier.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-400">
        订阅变更（订阅 · 升级 · 降级 · 取消）即将开放，将通过 Stripe 安全处理。
      </p>
    </div>
  );
}
