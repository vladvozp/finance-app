
import { Outlet, Link } from "react-router-dom";


export default function Layout() {
  return (
    <div className="h-dvh grid grid-rows-[auto,1fr,auto] overflow-hidden">
      {/* Main Content */}
      <main className="overflow-auto min-h-0">
        <Outlet /> 
      </main>

      {/* Footer */}
    <footer className="border-t border-transparent py-4 text-center text-xs text-gray-500">
        <a href="/impressum" className="underline hover:text-gray-700">Impressum</a>
        <span> · </span>
        <a href="/datenschutz" className="underline hover:text-gray-700">Datenschutz</a>
        <span> · </span>
        <Link to="/settings" className="underline hover:text-gray-700">
          Privatsphäre-Einstellungen
        </Link>
      </footer>
    </div>
  );
};


