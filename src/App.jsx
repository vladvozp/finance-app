import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes.jsx";
import { useAccountsStore } from "./store/accounts";
import { supabase } from "./lib/supabase";

export default function App() {
  const loadFromSupabase = useAccountsStore((s) => s.loadFromSupabase);

  useEffect(() => {

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await loadFromSupabase();

        if (window.location.pathname === "/login" ||
          window.location.pathname === "/") {
          const { accounts } = useAccountsStore.getState();
          window.location.href = accounts.length === 0 ? "/setup" : "/MonthPage";
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await loadFromSupabase();
          const { accounts } = useAccountsStore.getState();

          if (window.location.pathname === "/login" ||
            window.location.pathname === "/") {
            window.location.href = accounts.length === 0 ? "/setup" : "/MonthPage";
          }
        }
        if (event === "SIGNED_OUT") {
          window.location.href = "/login";
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <RouterProvider router={router} />;
}