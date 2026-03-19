// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLoginButton, GuestLoginButton } from "../features/auth/AuthButtons";
import { signInAnonymously } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    try {
      const { supabase } = await import("../lib/supabase");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/MonthPage`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Google-Login.");
    }
  }

  async function handleGuestLogin() {
    try {
      console.log("Guest login started");
      await signInAnonymously();
      console.log("signInAnonymously done");
      navigate("/MonthPage");
    } catch (err: any) {
      console.error("Guest login error:", err);
      setError(err.message ?? "Fehler beim Gastlogin.");
    }
  }

  return (
    <main className="flex items-start sm:items-center justify-center bg-white">
      <section className="py-10 sm:py-14 space-y-7 w-full max-w-sm px-4">
        <h1 className="text-[14px] font-bold text-left">
          Willkommen bei Finance Tracker!
        </h1>

        <GoogleLoginButton onClick={handleGoogleLogin} />

        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm">или</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <GuestLoginButton onClick={handleGuestLogin} />
      </section>
    </main>
  );
}