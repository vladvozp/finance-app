// src/pages/SettingsPage.tsx
import React, { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";

// Icons
import Arrowleft from "../assets/Arrowleft.svg?react";

// ---------- Types ----------
type NotificationPref = "off" | NotificationPermission; // "default" | "denied" | "granted"
type DateFormat = "YYYY-MM-DD" | "DD.MM.YYYY" | "MM/DD/YYYY" | "DD/MM/YYYY";
type ThemeMode = "system" | "light" | "dark";

interface AppSettings {
    currency: string;
    dateFormat: DateFormat;
    theme: ThemeMode;
    notifications: NotificationPref;
}

type SectionProps = {
    id: string;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
};

// ---------- Constants ----------
const LS_KEY_SETTINGS = "ft_settings";

const DEFAULT_SETTINGS: AppSettings = {
    currency: "EUR",
    dateFormat: "YYYY-MM-DD",
    theme: "system",
    notifications: "off",
};

const CURRENCIES: Array<{ code: string; symbol: string; name: string }> = [
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "USD", symbol: "$", name: "US-Dollar" },
    { code: "UAH", symbol: "₴", name: "Hrywnja" },
    { code: "PLN", symbol: "zł", name: "Polnischer Złoty" },
    { code: "GBP", symbol: "£", name: "Britisches Pfund" },
    { code: "CHF", symbol: "Fr", name: "Schweizer Franken" },
];

const DATE_FORMATS: Array<{ id: DateFormat; sample: string }> = [
    { id: "YYYY-MM-DD", sample: "2025-10-22" },
    { id: "DD.MM.YYYY", sample: "22.10.2025" },
    { id: "MM/DD/YYYY", sample: "10/22/2025" },
    { id: "DD/MM/YYYY", sample: "22/10/2025" },
];

const THEMES: Array<{ id: ThemeMode; label: string }> = [
    { id: "system", label: "System" },
    { id: "light", label: "Hell" },
    { id: "dark", label: "Dunkel" },
];

// ---------- Utils ----------
function readSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(LS_KEY_SETTINGS);
        if (!raw) return { ...DEFAULT_SETTINGS };
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return { ...DEFAULT_SETTINGS };
    }
}

function writeSettings(next: AppSettings): void {
    try {
        localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(next));
    } catch { }
}

function applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    const isSystemDark = !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const wantDark = theme === "dark" || (theme === "system" && isSystemDark);
    root.classList.toggle("dark", wantDark);
}

function sampleDate(fmt: DateFormat, date = new Date(2025, 9, 22)): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());
    switch (fmt) {
        case "DD.MM.YYYY":
            return `${dd}.${mm}.${yyyy}`;
        case "MM/DD/YYYY":
            return `${mm}/${dd}/${yyyy}`;
        case "DD/MM/YYYY":
            return `${dd}/${mm}/${yyyy}`;
        default:
            return `${yyyy}-${mm}-${dd}`;
    }
}

// ---------- UI ----------
function Section({ id, title, children, defaultOpen = true }: SectionProps) {
    const [open, setOpen] = useState<boolean>(defaultOpen);
    const contentId = `${id}-content`;
    return (
        <section
            aria-labelledby={id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm"
        >
            <button
                type="button"
                aria-expanded={open}
                aria-controls={contentId}
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left select-none"
            >
                <h2 id={id} className="text-lg font-semibold">
                    {title}
                </h2>
                <span className="text-sm opacity-70">{open ? "Zuklappen" : "Aufklappen"}</span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={contentId}
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.16 }}
                        className="px-4 pb-4"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

// ---------- Page ----------
export default function SettingsPage() {
    const navigate = useNavigate();

    // aria ids
    const currencyId = useId();
    const dateId = useId();
    const themeId = useId();
    const notifId = useId();
    // const dataId = useId();

    // settings state (unsaved edits) + dirty
    const [settings, setSettings] = useState<AppSettings>(() => readSettings());
    const [dirty, setDirty] = useState<boolean>(false);

    // preview theme immediately
    useEffect(() => {
        applyTheme(settings.theme);
        if (settings.theme === "system") {
            const m = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme("system");
            m.addEventListener?.("change", handler);
            return () => m.removeEventListener?.("change", handler);
        }
    }, [settings.theme]);

    // generic setter
    const setField = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => {
        setSettings((s) => ({ ...s, [k]: v }));
        setDirty(true);
    };

    // save button
    const [saving, setSaving] = useState<boolean>(false);
    function saveAll(): void {
        if (saving) return;
        setSaving(true);
        writeSettings(settings);
        setSaving(false);
        setDirty(false);
        alert("Einstellungen gespeichert ✅");
    }

    // notifications
    async function requestNotifications(): Promise<void> {
        if (!("Notification" in window)) {
            alert("Benachrichtigungen werden vom Browser nicht unterstützt.");
            return;
        }
        try {
            const res = await Notification.requestPermission();
            setField("notifications", res);
            if (res === "granted") {
                new Notification("Benachrichtigungen aktiviert", { body: "Testbenachrichtigung gesendet." });
            }
        } catch (e) {
            console.error(e);
        }
    }

    const currencyPreview = useMemo(() => {
        try {
            return new Intl.NumberFormat("de-DE", { style: "currency", currency: settings.currency }).format(1234.56);
        } catch {
            return "1234,56";
        }
    }, [settings.currency]);

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <style>{`
        @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .rotate-once { animation: spin-once 0.6s linear 1; }
      `}</style>

            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <button
                            type="button"
                            onClick={() => navigate(-1)} // go back one step in history
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800 cursor-pointer"
                        >
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </button>
                    }
                    center={<div className="text-base font-medium">Einstellungen</div>}
                    right={null}
                />

                <div className="max-w-3xl mx-auto w-full py-6 space-y-4">
                    {/* Currency */}
                    <Section id={currencyId} title="Währung">
                        <div className="flex flex-col gap-3" aria-labelledby={currencyId}>
                            <label className="text-sm opacity-80">Basiswährung für Anzeige und Formatierung</label>
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                                    value={settings.currency}
                                    onChange={(e) => setField("currency", e.target.value)}
                                    aria-label="Währung auswählen"
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.code} {c.symbol} — {c.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-sm opacity-70">Beispiel: {currencyPreview}</span>
                            </div>
                        </div>
                    </Section>

                    {/* Date format */}
                    <Section id={dateId} title="Datumsformat">
                        <fieldset className="grid gap-2" aria-labelledby={dateId}>
                            <legend className="sr-only">Datumsformat wählen</legend>
                            {DATE_FORMATS.map(({ id }) => (
                                <label key={id} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="dateFormat"
                                        value={id}
                                        checked={settings.dateFormat === id}
                                        onChange={(e) => setField("dateFormat", e.target.value as DateFormat)}
                                    />
                                    <span className="text-sm">
                                        {id} <span className="opacity-60">— {sampleDate(id)}</span>
                                    </span>
                                </label>
                            ))}
                        </fieldset>
                    </Section>

                    {/* Theme */}
                    <Section id={themeId} title="Design-Thema">
                        <fieldset className="grid gap-2" aria-labelledby={themeId}>
                            <legend className="sr-only">Thema wählen</legend>
                            {THEMES.map((t) => (
                                <label key={t.id} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value={t.id}
                                        checked={settings.theme === t.id}
                                        onChange={(e) => setField("theme", e.target.value as ThemeMode)}
                                    />
                                    <span className="text-sm">{t.label}</span>
                                </label>
                            ))}
                            <p className="text-sm opacity-70">"System" richtet sich automatisch nach den OS-Einstellungen.</p>
                        </fieldset>
                    </Section>

                    {/* Notifications */}
                    <Section id={notifId} title="Benachrichtigungen">
                        <div className="space-y-2" aria-labelledby={notifId}>
                            <p className="text-sm opacity-80">
                                Status: <b>{String(settings.notifications)}</b>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="primary" onClick={requestNotifications} >
                                    Erlaubnis anfragen & Test senden
                                </Button>
                                <Button variant="secondary" onClick={() => setField("notifications", "off")}>
                                    Im App-UI deaktivieren
                                </Button>
                            </div>
                            <p className="text-xs opacity-60">
                                Systemweite Freigaben werden im Browser verwaltet. Hier speichern wir nur Ihre Präferenz.
                            </p>
                        </div>
                    </Section>

                    {/* Save row  */}
                    <div className="pt-2">
                        <Button variant="primary" disabled={!dirty || saving} onClick={saveAll}>
                            {saving ? "Speichere…" : dirty ? "Einstellungen speichern" : "Gespeichert"}
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="max-w-3xl mx-auto w-full px-4 mt-8">

                    <div className="text-xs opacity-60 mt-3">Lokale Speicherung · keine Serveranbindung</div>
                </div>
            </main>
        </div>
    );
}
