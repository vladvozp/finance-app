// src/pages/Berichte.tsx
import React, { useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";

import { toCSV, download } from "../utils/exportCsv";
import { readTxList } from "../utils/storage";
// import type { Tx } from "../types/tx";


// Icons
import Arrowleft from "../assets/Arrowleft.svg?react";
// import Settings from "../assets/Settings.svg?react";
import { Settings } from "lucide-react";
// ---------- Page ----------
export default function Berichte() {
    const rows = readTxList();
    const navigate = useNavigate();

    // ids
    const dataId = useId();

    // export/import
    function exportAll(): void {
        const dump: Record<string, unknown> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            const v = localStorage.getItem(k);
            try {
                dump[k] = v ? JSON.parse(v) : null;
            } catch {
                dump[k] = v;
            }
        }
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-${new Date().toISOString().slice(0, 19)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const fileRef = useRef<HTMLInputElement | null>(null);
    function onImport(f: File): void {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(String(reader.result ?? "{}")) as Record<string, unknown>;
                Object.entries(json).forEach(([k, v]) => {
                    try {
                        localStorage.setItem(k, JSON.stringify(v));
                    } catch {
                        localStorage.setItem(k, String(v));
                    }
                });
                alert("Import abgeschlossen. Seite neu laden, um alles zu übernehmen.");
            } catch {
                alert("Ungültiges JSON");
            }
        };
        reader.readAsText(f);
    }

    function clearData(): void {
        const ok = confirm(
            "Alle lokalen Daten wirklich löschen?\n\n" +
            "• Einstellungen und App-Daten werden aus dem Browser-Speicher entfernt.\n" +
            "• Nicht rückgängig zu machen. Export vorher empfohlen."
        );
        if (!ok) return;
        localStorage.clear();
        alert("Bereinigt. Laden Sie die Seite neu.");
    }

    return (
        <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <button
                            type="button"
                            onClick={() => navigate(-1)} // go back one step in history
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </button>
                    }
                    center={<div className="text-base font-medium">Berichte</div>}
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 transition rounded-lg inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="block transform h-5 w-5 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>

                    }
                />

                <div className="max-w-3xl mx-auto w-full px-4 space-y-4">

                    {/* Data: clear/export/import */}
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={exportAll}>
                            Alles exportieren (JSON)
                        </Button>

                        {/* Data: CSV Export */}
                        <Button
                            variant="secondary"
                            onClick={() =>
                                download(`transactions_${Date.now()}.csv`, "\uFEFF" + toCSV(rows))
                            }
                        >
                            CSV Export
                        </Button>


                        <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                            Aus Datei importieren
                        </Button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onImport(f);
                            }}
                        />
                        <Button variant="secondary" onClick={clearData}>
                            Alle lokalen Daten löschen
                        </Button>
                    </div>
                    <details className="shadow-sm border border-gray-200 dark:border-gray-700 p-3">
                        <summary className="cursor-pointer select-none">Wie funktioniert das?</summary>
                        <ul className="list-disc pl-5 mt-2 text-sm opacity-80 space-y-1">
                            <li>
                                Export erstellt eine JSON-Sicherungsdatei mit <i>allen</i> localStorage-Einträgen.
                            </li>
                            <li> CSV-Export lädt nur die Transaktionen als Tabellen-Datei herunter
                                (praktisch für Excel oder Google Sheets).</li>
                            <li>Import liest eine JSON-Datei und schreibt die Schlüssel zurück (überschreibt vorhandene).</li>
                            <li>Bereinigung entfernt alle localStorage-Daten. Vorher Export empfehlen.</li>
                        </ul>
                    </details>
                </div>

                {/* Footer */}
                <div className="max-w-3xl mx-auto w-full px-4 mt-8">
                    <div className="text-xs opacity-60 mt-3">Lokale Speicherung · keine Serveranbindung</div>
                </div>
            </main>
        </div>
    );
}
