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
        <h1 className="text-[18px] font-bold shadow-xl text-left">
          Wie viel Geld hast du wirklich?
        </h1>
      </div>
      <GoogleLoginButton onClick={handleGoogleLogin} disabled={false} loading={false} />

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </main>

  );
}