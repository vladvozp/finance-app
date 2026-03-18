import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes.jsx";
import { useAccountsStore } from "./store/accounts";
import { supabase, signInAnonymously } from "./lib/supabase";

export default function App() {
  const loadFromSupabase = useAccountsStore((s) => s.loadFromSupabase);

  useEffect(() => {
    async function init() {
      // check session
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        // Anonymiusly login
        await signInAnonymously();
      }

      // load 
      await loadFromSupabase();
    }

    init();
  }, []);

  return <RouterProvider router={router} />;
}