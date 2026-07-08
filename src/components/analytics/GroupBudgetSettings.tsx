import { useState } from "react";
import { useDicts } from "../../store/dicts";
import {
    budgetGroupLabels,
    paymentTypeLabels,
    planTypeLabels,
    type BudgetGroup,
    type PaymentType,
    type PlanType,
} from "../../store/dicts";

export function GroupBudgetSettings() {
    const gruppen = useDicts((s) => s.gruppen);
    const updateGroupSettings = useDicts((s) => s.updateGroupSettings);

    const [savingId, setSavingId] = useState<string | null>(null);

    const handleUpdate = async (
        id: string,
        patch: {
            paymentType?: PaymentType;
            budgetGroup?: BudgetGroup;
            planType?: PlanType;
            planAmount?: number | null;
        }
    ) => {
        try {
            setSavingId(id);
            await updateGroupSettings(id, patch);
        } finally {
            setSavingId(null);
        }
    };

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                    Budgetplanung nach Kategorien
                </h2>
                <p className="text-sm text-slate-500">
                    Lege fest, ob eine Kategorie notwendig, frei verfügbar oder Zukunft ist.
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 text-left text-slate-500">
                            <th className="py-2 pr-3 font-medium">Kategorie</th>
                            <th className="py-2 pr-3 font-medium">Zahlungsart</th>
                            <th className="py-2 pr-3 font-medium">Budgetgruppe</th>
                            <th className="py-2 pr-3 font-medium">Planung</th>
                            <th className="py-2 pr-3 font-medium">Betrag</th>
                            <th className="py-2 pr-3 font-medium">Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        {gruppen.map((gruppe) => {
                            const paymentType = gruppe.paymentType ?? "normal";
                            const budgetGroup = gruppe.budgetGroup ?? "free";
                            const planType = gruppe.planType ?? "limit";
                            const planAmount = gruppe.planAmount ?? "";

                            return (
                                <tr key={gruppe.id} className="border-b border-slate-100">
                                    <td className="py-3 pr-3 font-medium text-slate-900">
                                        {gruppe.name}
                                    </td>

                                    <td className="py-3 pr-3">
                                        <select
                                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                                            value={paymentType}
                                            onChange={(e) =>
                                                handleUpdate(gruppe.id, {
                                                    paymentType: e.target.value as PaymentType,
                                                })
                                            }
                                        >
                                            {Object.entries(paymentTypeLabels).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="py-3 pr-3">
                                        <select
                                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                                            value={budgetGroup}
                                            onChange={(e) =>
                                                handleUpdate(gruppe.id, {
                                                    budgetGroup: e.target.value as BudgetGroup,
                                                })
                                            }
                                        >
                                            {Object.entries(budgetGroupLabels).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="py-3 pr-3">
                                        <select
                                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5"
                                            value={planType}
                                            onChange={(e) =>
                                                handleUpdate(gruppe.id, {
                                                    planType: e.target.value as PlanType,
                                                })
                                            }
                                        >
                                            {Object.entries(planTypeLabels).map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="py-3 pr-3">
                                        <input
                                            className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-right"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={planAmount}
                                            placeholder="0"
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                handleUpdate(gruppe.id, {
                                                    planAmount:
                                                        value.trim() === ""
                                                            ? null
                                                            : Number(value),
                                                });
                                            }}
                                        />
                                    </td>

                                    <td className="py-3 pr-3 text-slate-500">
                                        {savingId === gruppe.id ? "Speichert..." : "OK"}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}