// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLoginButton, GuestLoginButton } from "../features/auth/AuthButtons";
import Button from "../components/Button";
import { useAccountsStore } from "../store/accounts";
import { supabase, signInAnonymously } from "../lib/supabase";

export default function Login() {
  const INPUT =
    "w-full border border-gray-300 px-3 py-3 outline-none focus:ring-2 focus:ring-blue-400";

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert("Bestätigungs-E-Mail gesendet!");
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message ?? "Fehler beim Anmelden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/MonthPage`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleGuestLogin() {
    try {
      console.log("Guest login started");
      await signInAnonymously();
      console.log("signInAnonymously done");
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

        <GoogleLoginButton onClick={handleGoogleLogin}
          disabled={loading}
          loading={loading} />

        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm">oder</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="email">E-Mail-Adresse</label>
          <input
            id="email"
            type="email"
            placeholder="E-Mail-Adresse"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
            required
          />

          <label className="sr-only" htmlFor="password">Passwort</label>
          <input
            id="password"
            type="password"
            placeholder="Passwort"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT}
            required
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button variant="primary" disabled={loading} onClick={handleSubmit}>
            {loading ? "Laden…" : mode === "login" ? "Anmelden" : "Registrieren"}
          </Button>
        </form>

        <nav className="space-y-3 text-center">
          <div>
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium underline decoration-gray-800 underline-offset-4 text-gray-900"
            >
              {mode === "login" ? "Konto erstellen" : "Bereits registriert? Anmelden"}
            </button>
          </div>
          <div>
            <a href="#" className="text-blue-400 hover:underline">Passwort vergessen?</a>
          </div>
          <div>
            <GuestLoginButton onClick={handleGuestLogin} />
          </div>
        </nav>
      </section>
    </main>
  );
}