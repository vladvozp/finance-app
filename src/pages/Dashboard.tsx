import React from "react";
import { Link } from "react-router-dom";
import Settings from "../assets/Settings.svg?react";
import Arrowleft from "../assets/Arrowleft.svg?react";

import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";

/**
 * TransactionsDashboard — простая страница "Список + Edit".
 *
 * ВАЖНО: Ниже есть блок ADAPTER — там подключаемся к твоему ft-store.
 * Замени TODO на реальные селекторы/экшены из твоего стора.
 *
 * UI: React + Tailwind классы для красоты)
 */

/** =========================
 * ADAPTER под твой ft-store
 * =========================
 * Мы не знаем точные имена полей и экшенов в твоём store.
 * Поэтому делаем тонкий адаптер, который ты заполнишь 1 раз.
 */

// Примерная форма записи в твоём store (замени под себя)
export type FtTransaction = {
    id: string;
    date: string;            // ISO, например "2025-09-25T08:00:00.000Z"
    title?: string;          // Payee/Название
    note?: string;           // Описание
    amountCents: number;     // сумма в центах
    currency?: string;       // "EUR"
};

// То, что нужно дашборду (унифицированный тип)
export type UiTransaction = {
    id: string;
    datetime: string;        // ISO
    payee: string;
    description: string;
    amount: number;          // cents
    currency: string;        // "EUR"
};

// === Маппинг Ft -> UI и обратно ===
const toUi = (ft: FtTransaction): UiTransaction => ({
    id: ft.id,
    datetime: ft.date,
    payee: ft.title ?? "",
    description: ft.note ?? "",
    amount: ft.amountCents,
    currency: ft.currency ?? "EUR",
});

const toFt = (ui: UiTransaction): FtTransaction => ({
    id: ui.id,
    date: ui.datetime,
    title: ui.payee || undefined,
    note: ui.description || undefined,
    amountCents: ui.amount,
    currency: ui.currency,
});

/**
 * Хуки доступа к твоему store.
 * ЗАМЕНИ эти TODO на реальный импорт/селекторы.
 * Пример показан для Zustand: useFtStore((s)=> ...)
 */
// TODO: импортируй свой store
// import { useFtStore } from "../store/ft";

function useFtTransactions(): FtTransaction[] {
    // TODO: верни массив транзакций из стора
    // const items = useFtStore((s) => s.transactions);
    // return items;
    return [] as FtTransaction[]; // временно пусто, чтобы компонент компилился
}

function useFtActions() {
    return {
        // TODO: замени на твой экшен обновления существующей транзакции
        updateById: (tx: FtTransaction) => {
            // useFtStore.getState().updateTransaction(tx)
            console.warn("[TODO] updateById(ft) не подключён", tx);
        },
        // TODO: замени на экшен создания новой транзакции и верни созданный объект
        create: (tx: FtTransaction): FtTransaction => {
            // const created = useFtStore.getState().createTransaction(tx)
            console.warn("[TODO] create(ft) не подключён", tx);
            return { ...tx, id: crypto.randomUUID() };
        },
    };
}

/** =========================
 * Утилиты форматирования
 * ========================= */
function euro(cents: number) {
    return (cents / 100).toFixed(2) + " €";
}
function fmtDate(iso: string) {
    try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
}

/** =========================
 * Модалка редактирования
 * ========================= */
function EditDialog({
    open,
    tx,
    onClose,
    onSave,
}: {
    open: boolean;
    tx: UiTransaction | null;
    onClose: () => void;
    onSave: (next: UiTransaction) => void;
}) {
    const [form, setForm] = React.useState<UiTransaction | null>(tx);
    React.useEffect(() => setForm(tx), [tx]);
    if (!open || !form) return null;


    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg">Transaktion bearbeiten</h3>

                <div className="mt-4 flex flex-col gap-3">
                    <label className="form-control">
                        <span className="label-text">Datum</span>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={form.datetime.slice(0, 10)}
                            onChange={(e) =>
                                setForm({ ...form, datetime: new Date(e.target.value).toISOString() })
                            }
                        />
                    </label>

                    <label className="form-control">
                        <span className="label-text">Payee</span>
                        <input
                            className="input input-bordered"
                            value={form.payee}
                            onChange={(e) => setForm({ ...form, payee: e.target.value })}
                            placeholder="z.B. REWE"
                        />
                    </label>

                    <label className="form-control">
                        <span className="label-text">Beschreibung</span>
                        <input
                            className="input input-bordered"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Notiz"
                        />
                    </label>

                    <label className="form-control">
                        <span className="label-text">Betrag (EUR)</span>
                        <input
                            type="number"
                            step="0.01"
                            className="input input-bordered"
                            value={(form.amount / 100).toFixed(2)}
                            onChange={(e) => {
                                const val = Number((e.target.value || "0").replace(",", "."));
                                setForm({ ...form, amount: Math.round((isNaN(val) ? 0 : val) * 100) });
                            }}
                        />
                    </label>
                </div>

                <div className="modal-action">
                    <button className="btn btn-ghost" onClick={onClose}>Abbrechen</button>
                    <button
                        className="btn btn-primary"
                        onClick={() => form && onSave(form)}
                        disabled={!form.payee && !form.description}
                    >
                        Speichern
                    </button>
                </div>
            </div>
            <div className="modal-backdrop" onClick={onClose} />
        </div>

    );
}

/** =========================
 * Главная страница Dashboard
 * ========================= */
export default function TransactionsDashboard() {
    const ftItems = useFtTransactions();
    const { updateById, create } = useFtActions();

    // Преобразуем store-данные в UI-данные
    const items = React.useMemo(() => ftItems.map(toUi), [ftItems]);
    const sorted = React.useMemo(
        () => [...items].sort((a, b) => b.datetime.localeCompare(a.datetime)),
        [items]
    );
    const total = React.useMemo(() => sorted.reduce((acc, t) => acc + t.amount, 0), [sorted]);

    const [current, setCurrent] = React.useState<UiTransaction | null>(null);
    const [editOpen, setEditOpen] = React.useState(false);

    const onCreateQuick = () => {
        const base: UiTransaction = {
            id: crypto.randomUUID(),
            datetime: new Date().toISOString(),
            payee: "",
            description: "",
            amount: 0,
            currency: "EUR",
        };
        // создаём в ft-store и берём id (если store генерит сам — замени логику)
        const createdFt = create(toFt(base));
        const createdUi = toUi(createdFt);
        setCurrent(createdUi);
        setEditOpen(true);
    };

    const onEdit = (t: UiTransaction) => { setCurrent(t); setEditOpen(true); };

    const onSave = (next: UiTransaction) => {
        updateById(toFt(next));
        setEditOpen(false);
        setCurrent(null);
    };
    const navigate = useNavigate();
    const [spinOnce, setSpinOnce] = React.useState(false);
    const onGearClick = () => {
        if (spinOnce) return;
        setSpinOnce(true);
        setTimeout(() => setSpinOnce(false), 600);
    };
    return (
        <div className="bg-white">
            <style>{`
               @keyframes spin-once { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
               .rotate-once { animation: spin-once 0.6s linear 1; }
             `}</style>

            <main className="py-6 flex flex-col">
                <PageHeader
                    left={
                        <Link
                            to="/guest"
                            className="flex items-center gap-2 text-sm text-gray-600 underline hover:text-gray-800"
                        >
                            <Arrowleft className="w-5 h-5" />
                            Zurück
                        </Link>
                    }
                    center={null}
                    right={
                        <button
                            aria-label="Einstellungen"
                            className="p-2 rounded-md hover:bg-gray-100 transition"
                            onClick={onGearClick}
                            type="button"
                        >
                            <Settings className={`h-6 w-6 ${spinOnce ? "rotate-once" : ""}`} />
                        </button>
                    }
                />

                <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between gap-2">
                        <h1 className="text-xl font-semibold">Dashboard · Transactions</h1>
                        <div className="flex items-center gap-2">
                            <div className="badge badge-outline">{sorted.length} Einträge</div>
                            <div className="badge">{euro(total)}</div>
                            <button className="btn btn-primary" onClick={onCreateQuick}>+ Neu</button>
                        </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Datum</th>
                                    <th>Payee / Beschreibung</th>
                                    <th className="text-right">Betrag</th>
                                    <th className="text-right">Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center text-sm opacity-70">
                                            Пока пусто. Нажми «Neu», чтобы добавить первую транзакцию.
                                        </td>
                                    </tr>
                                )}

                                {sorted.map((t) => (
                                    <tr key={t.id} className="hover">
                                        <td className="whitespace-nowrap">{fmtDate(t.datetime)}</td>
                                        <td className="max-w-[520px]">
                                            <div className="truncate">
                                                <span className="font-medium">{t.payee || "—"}</span>
                                                {t.description ? <span className="opacity-70"> · {t.description}</span> : null}
                                            </div>
                                        </td>
                                        <td className="text-right font-medium">{euro(t.amount)}</td>
                                        <td className="text-right">
                                            <button className="btn btn-sm" onClick={() => onEdit(t)}>Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <EditDialog
                        open={editOpen}
                        tx={current}
                        onClose={() => { setEditOpen(false); setCurrent(null); }}
                        onSave={onSave}
                    />
                </div>
            </main>
        </div>

    );
}
