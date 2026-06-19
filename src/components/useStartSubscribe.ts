'use client';

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

// Handler for the "Subscribe / Upgrade" buttons: send logged-in users straight
// to the pricing page; prompt logged-out users to sign in first, then redirect
// them there automatically (see AuthProvider's post-login redirect).
export function useStartSubscribe() {
  const { user, openModal } = useAuth();
  const router = useRouter();
  return () => {
    if (user) router.push("/subscription");
    else openModal("/subscription");
  };
}
