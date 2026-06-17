'use client';

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";

const inputClass =
  "w-full rounded-md border border-amber-200 px-3 py-2 text-zinc-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200";

export function AuthModal() {
  const { modalOpen, closeModal, signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  // Reset transient state whenever the modal closes.
  useEffect(() => {
    if (!modalOpen) {
      setError(null);
      setInfo(null);
      setPassword("");
      setBusy(false);
    }
  }, [modalOpen]);

  if (!modalOpen) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      if (error) setError(error);
      else closeModal();
    } else {
      const { error, needsConfirmation } = await signUp(email, password);
      if (error) setError(error);
      else if (needsConfirmation)
        setInfo("注册成功！请查收邮件并点击确认链接以完成注册。");
      else closeModal();
    }
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop — intentionally NOT click-to-close, so an accidental click
          outside while typing won't dismiss the form. Use ✕ or Esc to close. */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-amber-200/70 bg-white p-6 shadow-xl ring-1 ring-amber-100/50">
        <button
          type="button"
          onClick={closeModal}
          aria-label="关闭"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-amber-600 transition hover:bg-amber-100 hover:text-amber-900"
        >
          ✕
        </button>

        <h2 className="mb-1 text-xl font-bold text-amber-900">
          {mode === "signin" ? "登录" : "注册"}
        </h2>
        <p className="mb-5 text-sm text-zinc-500">
          {mode === "signin" ? "欢迎回来" : "创建一个新账户"}
        </p>

        {!configured ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            认证服务尚未配置。请先在 .env.local 中填入 Supabase 的 URL 和 anon key。
          </p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-email" className="text-sm font-medium text-zinc-700">
                电子邮箱
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="auth-password" className="text-sm font-medium text-zinc-700">
                密码
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            {info && <p className="text-sm font-medium text-green-600">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 w-full rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-60"
            >
              {busy ? "请稍候…" : mode === "signin" ? "登录" : "注册"}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === "signin" ? "还没有账户？" : "已有账户？"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="font-semibold text-amber-700 hover:text-amber-900"
          >
            {mode === "signin" ? "注册" : "登录"}
          </button>
        </p>
      </div>
    </div>
  );
}
