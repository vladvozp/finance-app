// src/pages/Home.jsx
import { Link } from "react-router-dom";
import Settings from "../assets/Settings.svg?react";
import Plus from "../assets/Plus.svg?react";
import Barchart2 from "../assets/Barchart2.svg?react";
import Filetext from "../assets/Filetext.svg?react"; 
// import { motion } from "framer-motion";

export default function Home() {
  /**
   * Button presets (keep all buttons same size/spacing/typography).
   * If your Login page uses the same sizes, you’ll get a 1:1 visual match.
   */
  const BTN_BASE =
    "relative h-12 w-full border shadow-sm px-5 text-base flex items-center" + // size & typography
    ""   // layout
  const BTN_PRIMARY =
    BTN_BASE +
    "border border-gray-400 bg-blue-400 text-white hover:opacity-95";
  const BTN_SECONDARY =
    BTN_BASE +
    "border border-gray-400 bg-white text-blue-500 hover:bg-gray-50";

   const ICON = "absolute left-15 size-5 block self-center"; 
   const LABEL = "block w-full text-center leading-none self-center";

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
       { /*  <Link to="/settings" aria-label="Einstellungen" className="text-gray-600 hover:text-gray-800">
         <motion.div
         initial={{rotate: 0}}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, ease: "easeOut" }}
    style={{ cursor: "default"}}
>
    <Settings className="size-6 text-gray-600" /> 
    </motion.div> 
           </Link> */}
     </header>

        {/* Main section (same vertical spacing logic as on Login) */}
        <section className="flex-1">
          <h1 className="text-center text-xl font-semibold text-gray-600 mb-8">
            Was möchtest du tun?
          </h1>

          {/* Buttons block with consistent gaps */}
          <div className="space-y-5 pt-10">
            {/* Transaktion (primary) */}
         <button className={BTN_PRIMARY}>
  <Plus className={ICON} aria-hidden />
  <span className={LABEL}>Transaktion</span>
</button>

<button className={BTN_SECONDARY}>
  <Barchart2 className={ICON} aria-hidden />
  <span className={LABEL}>Dashboard</span>
</button>

<button className={BTN_SECONDARY}>
  <Filetext className={ICON} aria-hidden />
  <span className={LABEL}>Berichte</span>
</button>

<button className={BTN_SECONDARY}>
  <Settings className={ICON} aria-hidden />
  <span className={LABEL}>Einstellungen</span>
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
