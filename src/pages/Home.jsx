import { Link } from "react-router-dom";
import Settings from "../assets/Settings.svg?react";
import Plus from "../assets/Plus.svg?react";
import Barchart2 from "../assets/Barchart2.svg?react";
import Filetext from "../assets/Filetext.svg?react";

import Button from "../components/Button";


export default function Home() {
  return (
    <div className=" bg-white">
      <main className="mx-auto w-full max-w-[360px] px-5 py-6 flex flex-col ">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg className="size-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M15 6l-6 6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <Link to="/login" className="text-sm text-gray-600 underline hover:text-gray-800">
              Zur Startseite
            </Link>
          </div>
        </header>

        <section className="flex-1">
          <h1 className="text-center text-xl font-semibold text-gray-600 mb-8">
            Was möchtest du tun?
          </h1>

          <div className="space-y-5 pt-15">
            <Button variant="primary" icon={Plus}>Transaktion</Button>
            <Button variant="secondary" icon={Barchart2}>Dashboard</Button>
            <Button variant="secondary" icon={Filetext}>Berichte</Button>
            <Button variant="secondary" icon={Settings}>Einstellungen</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
