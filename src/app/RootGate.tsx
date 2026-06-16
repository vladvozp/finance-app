import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAccountsStore } from "../store/accounts";
import { useDicts } from "../store/dicts";

export default function RootGate() {
    const loadFromSupabase = useAccountsStore((s) => s.loadFromSupabase);
    const accounts = useAccountsStore((s) => s.accounts);
    const loadDicts = useDicts((s) => s.loadFromSupabase);

    const [loading, setLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadAppData = async () => {
            try {
                await loadFromSupabase();
                await loadDicts();
            } catch (e) {
                console.error("Load error:", e);
            }
        };

        const init = async () => {
            setLoading(true);

            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) {
                    console.error("Session error:", error);
                }

                if (!mounted) return;

                if (!session) {
                    setHasUser(false);
                    return;
                }

                setHasUser(true);
                await loadAppData();
            } catch (e) {
                console.error("RootGate init error:", e);
                if (mounted) {
                    setHasUser(false);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        init();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth event:", event);

            if (!mounted) return;

            if (!session) {
                setHasUser(false);
                setLoading(false);
                return;
            }

            setHasUser(true);

            setTimeout(async () => {
                if (!mounted) return;

                setLoading(true);

                try {
                    await loadAppData();
                } catch (e) {
                    console.error("Auth reload error:", e);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
            }, 0);
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