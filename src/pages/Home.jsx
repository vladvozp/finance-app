// src/pages/Home.jsx
import { Link } from "react-router-dom";

export default function Home() {
  /**
   * Button presets (keep all buttons same size/spacing/typography).
   * If your Login page uses the same sizes, you’ll get a 1:1 visual match.
   */
  const BTN_BASE =
    "h-14 w-full border text-base leading-none " + // size & typography
    "inline-flex items-center gap-3 px-5 " +                   // layout
    "shadow-sm";                                               // subtle elevation

  const BTN_PRIMARY =
    BTN_BASE +
    " border-gray-400 bg-blue-400 text-white hover:opacity-95";

  const BTN_SECONDARY =
    BTN_BASE +
    " border-gray-400 bg-white text-blue-500 hover:bg-gray-50";

  const ICON = "size-5 shrink-0"; // same icon size everywhere

  return (
    <div className="min-h-dvh bg-white">
      {/* Outer frame identical to Login: same max-width, paddings, vertical rhythm */}
      <main className="mx-auto w-full max-w-[360px] px-5 py-6 flex flex-col min-h-dvh">
        {/* Top bar (match Login spacing) */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            {/* back arrow */}
            <svg className="size-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to="/login" className="text-sm text-gray-600 underline hover:text-gray-800">
              Zur Startseite
            </Link>
          </div>

          {/* settings icon */}
          <Link to="/settings" aria-label="Einstellungen" className="text-gray-600 hover:text-gray-800">
            <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                d="M19.4 15a2 2 0 0 1 .4 2.2l.04.06a2 2 0 1 1-2.83 2.83l-.06-.04A2 2 0 0 1 15 19.4a2 2 0 0 1-2 .6 2 2 0 0 1-2-.6 2 2 0 0 1-2.95.85l-.06.04A2 2 0 1 1 5.1 17.2l.04-.06A2 2 0 0 1 4.6 15a2 2 0 0 1-.6-2 2 2 0 0 1 .6-2 2 2 0 0 1-.85-2.95l-.04-.06A2 2 0 1 1 6.8 5.1l.06.04A2 2 0 0 1 9 4.6a2 2 0 0 1 2-.6 2 2 0 0 1 2 .6 2 2 0 0 1 2.95-.85l.06-.04A2 2 0 1 1 18.9 6.8l-.04.06A2 2 0 0 1 19.4 9c.4.64.6 1.36.6 2s-.2 1.36-.6 2Z" />
            </svg>
          </Link>
        </header>

        {/* Main section (same vertical spacing logic as on Login) */}
        <section className="flex-1">
          <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">
            Was möchtest du tun?
          </h1>

          {/* Buttons block with consistent gaps */}
          <div className="space-y-5">
            {/* Transaktion (primary) */}
            <button type="button" className={BTN_PRIMARY}>
              <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Transaktion</span>
            </button>

            {/* Dashboard */}
            <button type="button" className={BTN_SECONDARY}>
              <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 14v4M12 10v8M18 6v12" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Dashboard</span>
            </button>

            {/* Berichte */}
            <button type="button" className={BTN_SECONDARY}>
              <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 7h5l3 3v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" strokeWidth="2" />
                <path d="M13 7v3h3" strokeWidth="2" />
                <path d="M9 13h6M9 16h6" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Berichte</span>
            </button>

            {/* Einstellungen */}
            <button type="button" className={BTN_SECONDARY}>
              <svg className={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" strokeWidth="2" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  d="M19.4 15a2 2 0 0 1 .4 2.2l.04.06a2 2 0 1 1-2.83 2.83l-.06-.04A2 2 0 0 1 15 19.4a2 2 0 0 1-2 .6 2 2 0 0 1-2-.6 2 2 0 0 1-2.95.85l-.06.04A2 2 0 1 1 5.1 17.2l.04-.06A2 2 0 0 1 4.6 15a2 2 0 0 1-.6-2 2 2 0 0 1 .6-2 2 2 0 0 1-.85-2.95l-.04-.06A2 2 0 1 1 6.8 5.1l.06.04A2 2 0 0 1 9 4.6a2 2 0 0 1 2-.6 2 2 0 0 1 2 .6 2 2 0 0 1 2.95-.85l.06-.04A2 2 0 1 1 18.9 6.8l-.04.06A2 2 0 0 1 19.4 9c.4.64.6 1.36.6 2s-.2 1.36-.6 2Z" />
              </svg>
              <span>Einstellungen</span>
            </button>
          </div>
        </section>

        {/* Footer (same bottom spacing as Login) */}
        <footer className="mt-12 text-center text-xs text-gray-400">
          <a href="/impressum" className="underline hover:text-gray-600">Impressum</a>
          <span> · </span>
          <a href="/datenschutz" className="underline hover:text-gray-600">Datenschutz</a>
          <span> · </span>
          <Link to="/settings" className="underline hover:text-gray-600">Privatsphäre-Einstellungen</Link>
        </footer>
      </main>
    </div>
  );
}
