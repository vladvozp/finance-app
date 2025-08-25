// src/pages/Login.jsx
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  // --- design tokens / utility presets (keep in sync with Home.jsx) ---
  const WRAPPER = "min-h-dvh flex items-start sm:items-center justify-center bg-white";
  const CONTAINER = "w-full max-w-[360px] px-5 py-10 sm:py-14 space-y-7";
  const ICON = "size-5 shrink-0";

  // Buttons (same geometry as on Home)
  const BTN_BASE =
    "h-14 w-full border text-base leading-none " +
    "inline-flex items-center justify-center gap-3 px-5 shadow-sm";

  const BTN_PRIMARY =
    BTN_BASE + " border-gray-900 bg-[#7DB8FF] text-white hover:brightness-95 active:brightness-90";

  const BTN_SECONDARY =
    BTN_BASE + " border-gray-300 bg-white text-gray-900 hover:bg-gray-50";

  const BTN_GHOST_DIM =
    BTN_BASE + " border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200";

  // Inputs
  const INPUT =
    "w-full border border-gray-300 px-3 py-3 outline-none " +
    "focus:ring-2 focus:ring-blue-400"; // tip: use CSS var if you have --color-brand

  const navigate = useNavigate();

  // Handle real login later; for now navigate to /home
  function handleSubmit(e) {
    e.preventDefault();
    // TODO: validate credentials / call API
    navigate("/home");
  }

  return (
    <main className={WRAPPER}>
      <section className={CONTAINER}>
        {/* Title */}
        <h1 className="ml-4 mb-10 text-[14px] font-bold text-left">
          Willkommen bei Finance Tracker!
        </h1>

        {/* Google button */}
        <button type="button" className={BTN_SECONDARY}>
          {/* Google icon */}
          <svg className={ICON} viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-7.3 19-20 0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.4 6.1 29.5 4 24 4 16.1 4 9.3 8.6 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.1 0 9.9-1.9 13.5-5.2l-6.2-5.2C29.2 36 26.7 37 24 37c-5.1 0-9.4-3.4-10.9-8.1l-6.6 5.1C9.4 39.4 16.1 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.2 3.6-4.7 6-8.3 6-3.1 0-5.8-1.7-7.2-4.2l-6.6 5.1C15.1 39.6 19.2 42 24 42c10 0 19-7.3 19-20 0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          <span>Mit Google anmelden</span>
        </button>

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
          <button type="submit" className={BTN_PRIMARY}>
            Anmelden
          </button>
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
            <Link to="/home?guest=1" className={BTN_GHOST_DIM}>
              Ohne Anmeldung testen
            </Link>
          </div>
        </nav>

        {/* Footer */}
       <footer className="mt-12 text-center text-xs text-gray-400">
          <a href="/impressum" className="underline hover:text-gray-600">Impressum</a>
          <span> · </span>
          <a href="/datenschutz" className="underline hover:text-gray-600">Datenschutz</a>
          <span> · </span>
          <Link to="/settings" className="underline hover:text-gray-600">Privatsphäre-Einstellungen</Link>
        </footer>
      </section>
    </main>
  );
}
