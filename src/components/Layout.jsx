
import { Outlet, Link } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { useRef } from "react";

export default function Layout() {
  const mainRef = useRef < HTMLDivElement > (null);;

  return (
    <>
      <ScrollToTop scrollRef={mainRef} />
      <div className="h-dvh grid grid-rows-[auto,1fr,auto] overflow-hidden">


        {/* Main Content */}
        <main className="overflow-auto min-h-0">
          <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-transparent py-4 text-center text-xs text-gray-600">
          <a href="/impressum" className="underline hover:text-gray-800">Impressum</a>
          <span> · </span>
          <a href="/datenschutz" className="underline hover:text-gray-800">Datenschutz</a>
          {/*  <span> · </span> */}
          {/*  <Link to="/settings" className="underline hover:text-gray-800">
            Privatsphäre-Einstellungen
          </Link> */}
        </footer>
      </div>
    </>
  );
};


