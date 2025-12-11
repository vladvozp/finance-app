// GuestTransactionStep3.tsx
// Lernende UI: Anbieter → (meistgenutzte) Gruppe + Bemerkung.
// Kategorien entfernt, Gruppe ist optional. Anbieter-Liste nach Häufigkeit sortiert.

import { Link, useNavigate } from "react-router-dom";
import { useMemo, useCallback, useState } from "react";

import PageHeader from "../components/PageHeader.jsx";
import Button from "../components/Button";
import Progress from "../components/Progress";

import { Edit3, MoveLeft, Settings } from "lucide-react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";
import { useDicts } from "../store/dicts";
import { useIncomeDicts } from "../store/incomeDicts";

import { Combobox, type ComboOption } from "../components/ui/combobox";

type Provider = ComboOption & {};
type Group = ComboOption & {};
type Type = ComboOption & {};
type Source = ComboOption & {};

// ---------- Lern-Statistik für Anbieter & Gruppe ----------

type ProviderStats = {
    providerCounts: Record<string, number>; // wie oft Anbieter benutzt wurde
    providerGroupCounts: Record<string, Record<string, number>>; // providerId -> groupId -> count
};

const PROVIDER_STATS_KEY = "ft_provider_stats_v1";

function loadProviderStats(): ProviderStats {
    try {
        const raw = localStorage.getItem(PROVIDER_STATS_KEY);
        if (!raw) return { providerCounts: {}, providerGroupCounts: {} };
        const parsed = JSON.parse(raw);
        return {
            providerCounts: parsed.providerCounts || {},
            providerGroupCounts: parsed.providerGroupCounts || {},
        };
    } catch {
        return { providerCounts: {}, providerGroupCounts: {} };
    }
}

function saveProviderStats(stats: ProviderStats) {
    try {
        localStorage.setItem(PROVIDER_STATS_KEY, JSON.stringify(stats));
    } catch {
        // ignore
    }
}

function bumpProviderStats(stats: ProviderStats, providerId: string, groupId: string | ""): ProviderStats {
    if (!providerId) return stats;

    const next: ProviderStats = {
        providerCounts: { ...stats.providerCounts },
        providerGroupCounts: { ...stats.providerGroupCounts },
    };

    next.providerCounts[providerId] = (next.providerCounts[providerId] || 0) + 1;

    if (groupId) {
        const existingGroups = next.providerGroupCounts[providerId] || {};
        next.providerGroupCounts[providerId] = {
            ...existingGroups,
            [groupId]: (existingGroups[groupId] || 0) + 1,
        };
    }

    return next;
}

function getMostUsedGroupForProvider(providerId: string, stats: ProviderStats): string {
    const groups = stats.providerGroupCounts[providerId];
    if (!groups) return "";
    let bestId = "";
    let bestCount = 0;
    for (const [gid, count] of Object.entries(groups)) {
        if (count > bestCount) {
            bestId = gid;
            bestCount = count;
        }
    }
    return bestId;
}

// ---------- Page ----------

export default function GuestTransactionStep3() {
    const navigate = useNavigate();

    // Draft slice – Kategorie & gruppeMode entfernt
    const {
        kind = null,
        gruppeId = "",
        anbieterId = "",
        incomeType = "",
        quelleId = "",
        quelleName = "",
        remark = "",
    } = useTxDraft() as any;

    // Dicts
    const {
        gruppen,
        createGroup,
        renameGroup,
        deleteGroup,
        createProvider,
        renameProvider,
        deleteProvider,
    } = useDicts();
    const { incomeTypes, sources, createType, renameType, deleteType, createSource, renameSource, deleteSource } =
        useIncomeDicts();

    const anbieter = useDicts((s) => s.anbieter);

    // Lern-Statistiken (Anbieter → Gruppe)
    const [providerStats, setProviderStats] = useState<ProviderStats>(() => loadProviderStats());

    // Anbieter nach Häufigkeit sortieren: meist benutzte oben
    const providerOptions: Provider[] = useMemo(() => {
        const list = [...anbieter];
        list.sort((a, b) => {
            const sa = providerStats.providerCounts[a.id] || 0;
            const sb = providerStats.providerCounts[b.id] || 0;
            if (sa !== sb) return sb - sa; // absteigend nach Nutzung
            return a.name.localeCompare(b.name);
        });
        return list;
    }, [anbieter, providerStats]);

    // Handler

    const onProviderChange = useCallback(
        (id: string) => {
            txDraft.set("anbieterId", id);

            if (!id) return;

            // Wenn wir gelernt haben, dass dieser Anbieter meistens mit Gruppe X zusammenhängt,
            // tragen wir diese Gruppe automatisch ein (aber optional, User kann ändern/entfernen).
            const bestGroupId = getMostUsedGroupForProvider(id, providerStats);
            if (bestGroupId) {
                txDraft.set("gruppeId", bestGroupId);
            }
        },
        [providerStats]
    );

    const onGroupChange = useCallback((id: string) => {
        txDraft.set("gruppeId", id);
    }, []);

    // Proceed rules:
    // - Einnahmen: wie vorher (Typ & Quelle nötig)
    // - Ausgaben: Klassifizierung (Anbieter/Gruppe) ist optional → immer true
    const canProceed =
        kind === "income"
            ? Boolean(incomeType && (quelleId || quelleName))
            : kind === "expense"
                ? true
                : false;

    function next() {
        // Vor dem Weitergehen Lernsignal schreiben (nur bei Ausgaben)
        if (kind === "expense" && anbieterId) {
            const updated = bumpProviderStats(providerStats, anbieterId, gruppeId);
            setProviderStats(updated);
            saveProviderStats(updated);
        }

        navigate("/TestErgebniss");
    }

    return (
        <div className="bg-white">
            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guestTransactionStep2"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <MoveLeft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={<Progress step={3} total={4} className="hidden sm:flex w-[120px]" srLabel="Schrittfortschritt" />}
                    right={
                        <Link
                            to="/SettingsPage"
                            aria-label="Einstellungen"
                            className="group p-2 transition rounded-lg inline-flex items-center justify-center"
                            type="button"
                        >
                            <Settings className="h-5 w-5 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
                        </Link>
                    }
                />

                <section className="flex-1">
                    <h1 className="text-lg text-gray-600 mb-4">Demo-Zugang (Lernende Anbieter/Gruppe-Zuordnung)</h1>

                    {/* -------- Income branch (wie vorher) -------- */}
                    {kind === "income" && (
                        <>
                            <Combobox<Type>
                                label="Typ (Einnahme)"
                                required
                                options={incomeTypes}
                                value={incomeType}
                                onChange={(id) => txDraft.set("incomeType", id)}
                                placeholder="Typ wählen…"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createType(name);
                                    txDraft.set("incomeType", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameType(id, newName)}
                                onDelete={(id) => {
                                    deleteType(id);
                                    if (incomeType === id) txDraft.set("incomeType", "");
                                }}
                            />

                            <Combobox<Source>
                                label="Quelle"
                                required
                                options={sources}
                                value={quelleId || ""}
                                onChange={(id, opt) => txDraft.setMany({ quelleId: id, quelleName: opt?.name ?? "" })}
                                placeholder="z. B. Arbeitgeber"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createSource(name);
                                    txDraft.setMany({ quelleId: id, quelleName: name });
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameSource(id, newName)}
                                onDelete={(id) => {
                                    deleteSource(id);
                                    if (quelleId === id) txDraft.setMany({ quelleId: "", quelleName: "" });
                                }}
                            />
                        </>
                    )}

                    {/* -------- Expense branch: nur Anbieter + Gruppe + Bemerkung -------- */}
                    {kind === "expense" && (
                        <>
                            {/* 1) Anbieter – lernend, meistgenutzte zuerst */}
                            <Combobox<Provider>
                                label="Anbieter"
                                helperText="Meistgenutzte Anbieter stehen oben, z. B. Rewe, Aldi, Aral …"
                                options={providerOptions}
                                value={anbieterId}
                                onChange={onProviderChange}
                                placeholder="z. B. Rewe, Aral, Amazon"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createProvider(name, "");
                                    txDraft.set("anbieterId", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameProvider(id, newName)}
                                onDelete={(id) => {
                                    deleteProvider(id);
                                    if (anbieterId === id) txDraft.set("anbieterId", "");
                                }}
                            />

                            {/* 2) Gruppe – optional, aber oft automatisch vorbelegt */}
                            <div className="mb-2 flex items-center justify-between mt-4">
                                <div className="text-base font-medium">Gruppe</div>
                                <span className="text-xs text-gray-500">optional, z. B. Essen, Mobilität …</span>
                            </div>

                            <Combobox<Group>
                                label=""
                                options={gruppen}
                                value={gruppeId}
                                onChange={onGroupChange}
                                placeholder="Gruppe wählen… (z. B. Essen, Mobilität)"
                                allowCreate
                                onCreate={(name) => {
                                    const id = createGroup(name);
                                    txDraft.set("gruppeId", id);
                                }}
                                allowEdit
                                onEdit={(id, newName) => renameGroup(id, newName)}
                                onDelete={(id) => {
                                    deleteGroup(id);
                                    if (gruppeId === id) txDraft.set("gruppeId", "");
                                }}
                            />
                        </>
                    )}

                    {/* Remark */}
                    <div className="mt-6">
                        <div className="flex justify-center items-center text-black text-base gap-2 font-medium mb-1">
                            <span>Bemerkung</span>
                            <Edit3 className="w-4 h-4" />
                        </div>

                        <div className="relative">
                            <textarea
                                value={remark}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v.length <= 100) txDraft.set("remark", v);
                                }}
                                placeholder="Optionale Notiz (z. B. 'Aktion', 'für Schule' …)"
                                className="w-full h-24 border pl-3 pr-3 py-2 shadow-sm
                  focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  resize-none outline-none placeholder-gray-400"
                                maxLength={100}
                            />
                            <span className="absolute bottom-1 right-3 text-xs text-gray-500">{remark.length}/100</span>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button variant="primary" onClick={next} disabled={!canProceed}>
                            Weiter
                        </Button>
                    </div>
                </section>

                {/* Developer Panel – leicht angepasst (Kategorien raus aus Anzeige nicht zwingend, но можно оставить) */}
                <div className="mt-10 border-t border-gray-300 pt-3 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => {
                                localStorage.removeItem("ft_dicts_v2");
                                localStorage.removeItem("ft_income_dicts_v1");
                                localStorage.removeItem(PROVIDER_STATS_KEY);
                                location.reload();
                            }}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        >
                            🧹 Reset Dictionaries & Provider-Stats
                        </button>

                        <button
                            onClick={() => {
                                console.log("Gruppen:", useDicts.getState().gruppen);
                                console.log("Anbieter:", useDicts.getState().anbieter);
                                console.log("Income Types:", useIncomeDicts.getState().incomeTypes);
                                console.log("Sources:", useIncomeDicts.getState().sources);
                                console.log("ProviderStats:", loadProviderStats());
                                alert("✅ Data printed in console");
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                        >
                            💾 Show Data (Console)
                        </button>
                    </div>

                    <div className="mt-3 text-gray-500">
                        <p>Gruppen: {useDicts.getState().gruppen.length}</p>
                        <p>Anbieter: {useDicts.getState().anbieter.length}</p>
                        <p>Income Types: {useIncomeDicts.getState().incomeTypes.length}</p>
                        <p>Sources: {useIncomeDicts.getState().sources.length}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
