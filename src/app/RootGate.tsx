import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";

export default function RootGate() {
    const loadFromSupabase = useAccountsStore((s) => s.loadFromSupabase);
    const accounts = useAccountsStore((s) => s.accounts);

    const [loading, setLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);

    const loadDicts = useDicts((s) => s.loadFromSupabase);


    useEffect(() => {
        let mounted = true;

        const checkUserAndAccounts = async () => {
            setLoading(true);

            const { data: { session } } = await supabase.auth.getSession();

            if (!mounted) return;

            if (!session) {
                setHasUser(false);
                setLoading(false);
                return;
            }

            setHasUser(true);

            try {
                await loadFromSupabase();
                await loadDicts();
            } catch (e) {
                console.error("Load error:", e);
            }

            if (!mounted) return;
            setLoading(false);

        };

        checkUserAndAccounts();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === "SIGNED_OUT") {
                if (!mounted) return;
                setHasUser(false);
                setLoading(false);
                return;
            }

            if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
                await checkUserAndAccounts();
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [loadFromSupabase, loadDicts]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!hasUser) {
        return <Navigate to="/login" replace />;
    }

    if (accounts.length === 0) {
        return <Navigate to="/setup" replace />;
    }

    return <Navigate to="/MonthPage" replace />;
}