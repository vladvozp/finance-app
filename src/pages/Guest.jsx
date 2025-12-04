import { Link } from "react-router-dom";
// import Settings from "../assets/Settings.svg?react";
import { MoveLeft, Plus, ChartNoAxesColumn, Sheet, Settings } from "lucide-react";

// import Plus from "../assets/Plus.svg?react";
// import Barchart2 from "../assets/Barchart2.svg?react";
// import Filetext from "../assets/Filetext.svg?react";
// import Arrowleft from "../assets/Arrowleft.svg?react";

import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";

export default function Guest() {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      <main className="py-6 flex flex-col">
        <PageHeader
          left={
            <Link
              to="/login"
              className="flex items-center gap-1 text-sm text-gray-600 underline hover:text-gray-800"
            >
              <MoveLeft className="w-5 h-5" />
              Zur Anmeldung
            </Link>
          }
          center={null}
          right={null}
        />

        <section className="flex-1">
          <h1 className="text-lg text-gray-600 mb-2">Demo-Zugang ohne Speicherung</h1>
          <p className="mb-6">
            Sie sind ohne Registrierung eingeloggt.
            Dies ist eine Demo-Version, Daten werden nicht gespeichert.
          </p>
          <h2 className="text-center text-xl font-semibold text-gray-600 mb-8">
            Was möchtest du tun?
          </h2>
          <div className="space-y-5 pt-15">
            <Button variant="primary" icon={Plus} onClick={() => navigate("/GuestTransactionOne")} >Transaktion</Button>
            <Button variant="secondary" icon={ChartNoAxesColumn} onClick={() => navigate("/Dashboard")} >Dashboard</Button>
            <Button variant="secondary" icon={Sheet} onClick={() => navigate("/Berichte")} >Berichte</Button>
            <Button variant="secondary" icon={Settings} onClick={() => navigate("/SettingsPage")}  >Einstellungen</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
