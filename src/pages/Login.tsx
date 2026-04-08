// src/pages/Login.tsx
import { useState } from "react";
import { GoogleLoginButton } from "../features/auth/AuthButtons";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(false);

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <main className="flex flex-col">
      <div className="bg-white py-30 mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 leading-tight">
            Wie viel kannst du heute wirklich ausgeben?
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Nicht am Monatsende. Sondern jetzt.
          </p>
        </div>
        <GoogleLoginButton onClick={handleGoogleLogin} disabled={false} loading={false} />
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <p className="text-sm text-gray-500 mb-3 text-center">
        Ohne komplizierte Tabellen. Einfach verstehen, was dir wirklich bleibt.
      </p>

      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">So sieht deine Realität aus 👇</span>

          <div className="flex-1 h-px bg-gray-200" />

        </div>

        <div className="group relative bg-gray-100/60 rounded-2xl p-3 border border-gray-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden">
          <img
            src="/preview.png"
            alt="Klarsio App Vorschau"
            className="w-full rounded-xl cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.01]"
            onClick={() => setLightbox(true)}
          />
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src="/preview.png"
            alt="Klarsio App Vorschau"
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}
    </main >

  );
}