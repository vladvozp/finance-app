// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLoginButton, GuestLoginButton } from "../features/auth/AuthButtons";
import Button from "../components/Button";

export default function Login() {
  // --- design tokens / utility presets (keep in sync with Home.jsx) ---
  const WRAPPER = " flex items-start sm:items-center justify-center bg-white";
  const CONTAINER = "py-10 sm:py-14 space-y-7";


  // Inputs
  const INPUT =
    "w-full border border-gray-300 px-3 py-3 outline-none " +
    "focus:ring-2 focus:ring-blue-400"; // tip: use CSS var if you have --color-brand

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // define the function used by onClick
  function handleGoogleLogin() {
    console.log("Google login clicked");
    // TODO: trigger your OAuth flow here
  }
function handleGuestLogin() {
  navigate("/guest");
}
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: real API call
      await new Promise(r => setTimeout(r, 900));
      navigate("/home");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={WRAPPER}>
      <section className={CONTAINER}>
        {/* Title */}
        <h1 className="ml-4 mb-10 text-[14px] font-bold text-left">
          Willkommen bei Finance Tracker!
        </h1>

        {/* Google button */}
       <GoogleLoginButton onClick={handleGoogleLogin} />

        {/* Divider */}
        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex-1 border-t border-gray-300" />
          <span className="text-sm">oder</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="email">E-Mail-Adresse</label>
          <input id="email" type="email" placeholder="E-Mail-Adresse" autoComplete="email" className={INPUT} />

          <label className="sr-only" htmlFor="password">Passwort</label>
          <input id="password" type="password" placeholder="Passwort" autoComplete="current-password" className={INPUT} />

          {/* Stay signed in */}
          <label className="flex items-center gap-3 pt-2">
            <input type="checkbox" className="size-4 accent-black" />
            <span>Angemeldet bleiben</span>
          </label>

          {/* Primary submit */}
          <Button variant="primary">Anmelden</Button>
        </form>

        {/* Links */}
        <nav className="space-y-3 text-center">
          <div>
            <a href="#" className="font-medium underline decoration-gray-800 underline-offset-4 text-gray-900">
              Konto erstellen
            </a>
          </div>
          <div>
            <a href="#" className="text-blue-400 hover:underline">Passwort vergessen?</a>
          </div>
          <div>
            {/* Guest login (demo) */}
            <GuestLoginButton onClick={handleGuestLogin}/>
          </div>
        </nav>
      </section>
    </main>
  );
}
