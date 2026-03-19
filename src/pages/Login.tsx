// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLoginButton, GuestLoginButton } from "../features/auth/AuthButtons";
import { supabase, signInAnonymously } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
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
    <main className="flex items-center justify-center bg-white">
      <section className="py-10 space-y-7 w-full max-w-sm px-4">
        <h1 className="text-[14px] font-bold text-left">
          Willkommen bei Finance Tracker!
        </h1>

        <GoogleLoginButton onClick={handleGoogleLogin} disabled={false} loading={false} />
        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm">oder</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <GuestLoginButton onClick={handleGuestLogin} />
      </section>
    </main>
  );
}