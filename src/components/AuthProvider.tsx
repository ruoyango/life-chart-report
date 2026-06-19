'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  // Login modal open/close state lives here so the nav button and the modal
  // can share it.
  modalOpen: boolean;
  openModal: (redirect?: string) => void;
  closeModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  // Where to send the user after a successful login — set when a "Subscribe"
  // button opens the modal for a logged-out user. Overwritten on every openModal
  // call (a plain login passes none), so it can't fire a stale redirect.
  const postAuthRedirect = useRef<string | null>(null);

  // Load the current session and keep it in sync with auth events.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      // After a fresh login triggered by a "Subscribe" button, jump to where the
      // user was headed (the pricing page).
      if (event === "SIGNED_IN" && postAuthRedirect.current) {
        const dest = postAuthRedirect.current;
        postAuthRedirect.current = null;
        router.push(dest);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: "认证服务尚未配置。" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { error: "认证服务尚未配置。", needsConfirmation: false };
    // Send the confirmation link back to the page the user signed up on — works
    // for both localhost and the deployed site (incl. the basePath). This URL
    // must be allow-listed in Supabase → Auth → URL Configuration → Redirect URLs.
    const emailRedirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    // When email confirmation is enabled, sign-up returns no session — the user
    // must click the confirmation link before they can log in.
    return { error: null, needsConfirmation: !data.session };
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        configured: isSupabaseConfigured,
        modalOpen,
        openModal: (redirect?: string) => {
          postAuthRedirect.current = redirect ?? null;
          setModalOpen(true);
        },
        closeModal: () => setModalOpen(false),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
