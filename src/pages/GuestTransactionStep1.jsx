import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

import Plus from "../assets/Plus.svg?react";
import MagnifyingGlass from "../assets/MagnifyingGlass.svg?react";
import PensilIcon from "../assets/PensilIcon.svg?react";
import DoubleDownArrow from "../assets/DoubleDownArrow.svg?react";


import PageHeader from "../components/PageHeader.jsx";


export default function TransactionStep3() {
  // spinOnce controls a single 360° rotation of the gear icon
  const navigate = useNavigate();
  const [spinOnce, setSpinOnce] = useState(false);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState(""); // amount input

 // ---- Accounts combobox state ----
const [query, setQuery] = useState("");             // search text
const [open, setOpen] = useState(false);           // dropdown visibility
const [selectedId, setSelectedId] = useState("");  // chosen account id
const comboboxRef = useRef(null);                  // for outside-click
 

// demo data — replace with real accounts from store/api
const accounts = [
  { id: "n26", name: "N26", balance: 100000 },   // cents
  { id: "pp",  name: "PayPal", balance: 40000  },
];

const filtered = query.trim()
  ? accounts.filter(a => a.name.toLowerCase().includes(query.trim().toLowerCase()))
  : accounts;

// German currency formatting (from cents)
const fmtDe = (cents) =>
  (cents / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// close dropdown on outside click
useEffect(() => {
  const onDoc = (e) => {
    if (!open) return;
    if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
      setOpen(false);
    }
  };
  document.addEventListener("mousedown", onDoc);
  return () => document.removeEventListener("mousedown", onDoc);
}, [open]);


 
  // Convert string to cents (integer)
  const toCents = (s) => {
    if (!s) return 0;
    const n = Number(s.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
  };

  // Format number of cents into German locale format
  const formatDe = (cents) =>
    (cents / 100).toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Handle typing in input
  const handleChange = (e) => {
    let v = e.target.value;
    v = v.replace(/[^\d.,]/g, ""); // allow digits, comma, dot
    const parts = v.split(/[.,]/);
    if (parts.length > 2) {
      v = parts[0] + "," + parts.slice(1).join(""); // collapse multiple separators
    }
    setAmount(v);
  };

  // Block invalid keys
  const handleKeyDown = (e) => {
    if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
  };

  // On blur, format nicely or reset
  const handleBlur = () => {
    const cents = toCents(amount);
    if (cents <= 0) {
      setAmount("");
    } else {
      setAmount(formatDe(cents));
    }
  };


  // Trigger a single rotation on click
  const onGearClick = () => {
    // prevent re-triggering while animation is in progress
    if (spinOnce) return;
    setSpinOnce(true);
    // remove the class after animation completes (duration must match CSS)
    setTimeout(() => setSpinOnce(false), 600);

     // selected transaction type: "expense" | "income"
  };

  return (
    <div className="bg-white">
      {/* Local CSS for one-time rotation animation */}
      <style>{`
        @keyframes spin-once {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .rotate-once {
          animation: spin-once 0.6s linear 1;
        }
      `}</style>

      <main className="py-6 flex flex-col">
        {/* Header: back (left) + settings (right) */}
      <PageHeader
        left={
        <Link
            to="/guest"
            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
          >
            <Arrowleft className="w-5 h-5" />
           Zurück
          </Link>
        }
        center={null}
        right={
          <button
            aria-label="Einstellungen"
            className="p-2 rounded-md hover:bg-gray-100 transition"
            onClick={onGearClick}
            type="button"
          >
            {/* Gear spins exactly once per click */}
            <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
          </button>
        }
   />

        {/* Content */}

        <section className="flex-1">
          {/* H1 */}
          <h1 className="text-lg text-gray-600 mb-10">
            Demo-Zugang ohne Speicherung
          </h1>

          {/* Section title */}
          <h2 className="text-center text-black text-base font-medium mb-1">
            Transaction Typ
          </h2>

          {/* Toggle */}
          <div className="flex w-full shadow-sm overflow-hidden ">
            {/* Expense */}
            <button
              type="button"
              onClick={() => setType("expense")}
              aria-pressed={type === "expense"}
              className={`w-1/2 h-12 text-center font-medium transition border border-gray-400
                ${type === "expense"
                  ? "bg-blue-400 text-white"
                  : "bg-white text-blue-500 hover:bg-blue-50"}`}
            >
              Ausgabe
            </button>

            {/* Income */}
            <button
              type="button"
              onClick={() => setType("income")}
              aria-pressed={type === "income"}
              className={`w-1/2 h-12 text-center font-medium transition border border-gray-400
                ${type === "income"
                  ? "bg-blue-400 text-white"
                  : "bg-white text-blue-500 hover:bg-blue-50"}`}
            >
              Einnahme
            </button>
          </div>
  
   {/* Amount input */}
        <div className="mt-6">
          <h2 className="text-center text-black text-base font-medium mb-1">
            Betrag eingeben
          </h2>
          <input
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="h-12 w-full border shadow-sm border-gray-400 px-3 placeholder-gray-400 outline-none
                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            aria-label="Betrag"
          />
          <p className="mt-1 text-xs text-gray-500">
           Nur positive Beträge. Beispiel: 12,99
          </p>
        </div>


          {/* (Optional) Add next form fields below */}
          {/* e.g., amount input, account search, etc. */}
        </section>
{/* Account selection */}
<section className="mt-6" ref={comboboxRef}>
  {/* Section title */}
  <h2 className="text-center text-black text-base font-medium mb-1">Konto auswählen</h2>

  {/* Input with search icon + clear button */}
  <div className="relative">
    {/* left search icon */}
    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
      {/* use your own SVG if you have; emoji as fallback */}
      <MagnifyingGlass className="w-5 h-5"/></span>
  

    <input
      type="text"
      placeholder="Sparkasse"
      value={query}
      onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)}
      className="h-12 w-full border shadow-sm border-gray-500/80 pl-9 pr-10
                 outline-none placeholder-gray-400
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls="account-listbox"
      role="combobox"
    />

    {/* clear button (right) */}
    {query && (
      <button
        type="button"
        aria-label="Eingabe löschen"
        onClick={() => { setQuery(""); setOpen(true); }}
        className="absolute inset-y-0 right-2 flex items-center rounded p-1 text-gray-500 hover:bg-gray-100"
      >
        ✕
      </button>
    )}
  </div>

  {/* Dropdown */}
  {open && (
    <div
      className="relative z-20"
      role="listbox"
      id="account-listbox"
      aria-label="Kontoliste"
    >
      <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-[#F6F0FF] p-2 shadow">
        {filtered.map((acc) => (
          <li key={acc.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedId(acc.id);
                setQuery(acc.name);   // put chosen name into the input
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition
                ${selectedId === acc.id ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
              role="option"
              aria-selected={selectedId === acc.id}
            >
              <span className="flex items-center gap-2">
                {/* replace with your account icon if you have */}
                <PensilIcon className="w-4 h-4"/>
                <span>{acc.name}</span>
              </span>
              <span className="tabular-nums">{fmtDe(acc.balance)}</span>
            </button>
          </li>
        ))}

        {/* Create new account */}
        <li className="mt-1 border-t border-gray-200 pt-1">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              // TODO: open your "create account" modal/route here
              console.log("Create new account");
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-white/70 transition"
          >
            <Plus className="w-5 h-5"/>
            <span>Neues Konto erstellen</span>
          </button>
        </li>
      </ul>
    </div>
  )}

  {/* “All accounts” link */}
  <button
    type="button"
    onClick={() => console.log("Show all accounts")}
    className="mt-3 flex items-center gap-2 text-sm text-gray-700 hover:underline"
  >
    <DoubleDownArrow className="w-3 h-3"/>
    <span>Alle Konten anzeigen</span>
  </button>
<div className="pt-10"></div>
 <Button variant="primary" onClick={() => navigate("/guestTransactionStep1")} >Weiter</Button>


</section>



      </main>
    </div>
  );
}
