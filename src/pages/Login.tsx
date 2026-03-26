// src/pages/Login.tsx
import { useState } from "react";
import { GoogleLoginButton } from "../features/auth/AuthButtons";
import { supabase } from "../lib/supabase";
export default function Login() {
  const [error, setError] = useState("");

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
    <main className="py-6 flex flex-col">
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
    </main>

  );
}