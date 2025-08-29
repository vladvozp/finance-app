// src/pages/Home.jsx
import { Link } from "react-router-dom";
import Settings from "../assets/Settings.svg?react";
import Plus from "../assets/Plus.svg?react";
import Barchart2 from "../assets/Barchart2.svg?react";
import Filetext from "../assets/Filetext.svg?react"; 
import { motion } from "framer-motion";

export default function Home() {
  /**
   * Button presets (keep all buttons same size/spacing/typography).
   * If your Login page uses the same sizes, you’ll get a 1:1 visual match.
   */
  const BTN_BASE =
    "h-12 w-full border text-base leading-none " + // size & typography
    "inline-flex items-center gap-3 px-5  justify-center shadow-sm "   // layout
    
  const BTN_PRIMARY =
    BTN_BASE +
    "border-gray-400 bg-blue-400 text-white hover:opacity-95";

  const BTN_SECONDARY =
    BTN_BASE +
    "border-gray-400 bg-white text-blue-500 hover:bg-gray-50";

 //const ICON = "size-5 shrink-0"; 

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
          <h1 className="text-center text-2xl font-semibold text-gray-800 mb-8">
            Was möchtest du tun?
          </h1>

          {/* Buttons block with consistent gaps */}
          <div className="space-y-5">
            {/* Transaktion (primary) */}
            <button type="button" className={BTN_PRIMARY}>
             <Plus className="size-5 text-gray-600" />
              <span>Transaktion</span>
            </button>

            {/* Dashboard */}
            <button type="button" className={BTN_SECONDARY}>
            <Barchart2 className="size-5 text-gray-600" />
              <span>Dashboard</span>
            </button>

            {/* Berichte */}
            <button type="button" className={BTN_SECONDARY}>
              <Filetext className="size-5 text-gray-600" /> 
              <span>Berichte</span>
            </button>

            {/* Einstellungen */}
            <button type="button" className={BTN_SECONDARY}>
              <Settings className="size-5 text-gray-600" />
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
