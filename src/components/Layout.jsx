
import { Outlet, Link } from "react-router-dom";


export default function Layout() {
  return (
    <div className="h-dvh grid grid-rows-[auto,1fr,auto] overflow-hidden">

      {/* Main Content */}
      <main className="overflow-auto min-h-0">
        <div className="mx-auto w-full max-w-[360px] px-5">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-transparent py-4 text-center text-xs text-gray-600">
        <a href="/impressum" className="underline hover:text-gray-800">Impressum</a>
        <span> · </span>
        <a href="/datenschutz" className="underline hover:text-gray-800">Datenschutz</a>
        <span> · </span>
        <Link to="/settings" className="underline hover:text-gray-800">
          Privatsphäre-Einstellungen
        </Link>
      </footer>
    </div>
  );
};


