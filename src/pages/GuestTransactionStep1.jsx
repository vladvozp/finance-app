import { Link } from "react-router-dom";
import { useState } from "react";

import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";

import PageHeader from "../components/PageHeader.jsx";


export default function TransactionStep3() {
  // spinOnce controls a single 360° rotation of the gear icon
  const [spinOnce, setSpinOnce] = useState(false);

  // selected transaction type: "expense" | "income"
  const [type, setType] = useState("expense");

  // Trigger a single rotation on click
  const onGearClick = () => {
    // prevent re-triggering while animation is in progress
    if (spinOnce) return;
    setSpinOnce(true);
    // remove the class after animation completes (duration must match CSS)
    setTimeout(() => setSpinOnce(false), 600);
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
          <h2 className="text-center text-black-800 text-base font-medium mb-1">
            Transaction Typ
          </h2>

          {/* Toggle */}
          <div className=" relative h-12 flex w-full shadow-sm  overflow-hidden ">
            {/* Expense */}
            <button
              type="button"
              onClick={() => setType("expense")}
              aria-pressed={type === "expense"}
              className={`w-1/2 py-2 text-center font-medium transition border border-gray-400
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
              className={`w-1/2 py-2 text-center font-medium transition border border-gray-400
                ${type === "income"
                  ? "bg-blue-400 text-white"
                  : "bg-white text-blue-500 hover:bg-blue-50"}`}
            >
              Einnahme
            </button>
          </div>

          {/* (Optional) Add next form fields below */}
          {/* e.g., amount input, account search, etc. */}
        </section>
      </main>
    </div>
  );
}
