import { Link } from "react-router-dom";
import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";
import { useState } from "react";

export default function TransactionStep3() {
const [spin, setSpin] = useState(false);
    return (
      <div className=" bg-white">
      <main className="mx-auto w-full max-w-[360px] px-5 py-6 flex flex-col ">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2"  >
             <Arrowleft className="w-5 h-5 inline-block mr-2"/>
            <Link to="/guest" className="text-sm text-gray-600 underline hover:text-gray-800" >
         Zurück
            </Link>
          </div> 
        <button
      aria-label="Einstellungen"
      className="btn btn-ghost btn-sm"
      onClick={() => setSpin(!spin)}
    >
      <Settings className={`h-6 w-6 ${spin ? "animate-spin" : ""}`} />
    </button>
        </header>
 <section className="flex-1">
    
     </section>
     </main>
    </div>
  );
}