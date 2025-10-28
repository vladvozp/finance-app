// src/pages/GuestTransactionStep1.jsx
import PageHeader from "../components/PageHeader.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";

import { useTxDraft } from "../hooks/useTxDraft";
import { txDraft } from "../store/transactionDraft";

import Button from "../components/Button";
import Progress from "../components/Progress";

import Arrowleft from "../assets/Arrowleft.svg?react";
import Settings from "../assets/Settings.svg?react";
import Plus from "../assets/Plus.svg?react";
import MagnifyingGlass from "../assets/MagnifyingGlass.svg?react";
import PencilIcon from "../assets/PencilIcon.svg?react";
import DoubleDownArrow from "../assets/DoubleDownArrow.svg?react";
import Cross from "../assets/Cross.svg?react";

const ACC_KEY = "ft_accounts";

// ---------- Helpers ----------
const fmtEur = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);

// Parse "12,34" → 1234 cents
const toCents = (s) => {
  if (!s) return 0;
  const n = Number(String(s).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

// Create a new account object with sane defaults
function createDefaultAccount(name) {
  const now = new Date().toISOString();
  const id = crypto?.randomUUID ? crypto.randomUUID() : `acc_${Date.now()}`;
  return {
    id,
    name,
    currency: "EUR",
    openingBalance: 0,   // editable
    openingDate: null,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
}

// Ensure ft_accounts exists and has at least one account
export function ensureAccounts() {
  try {
    const raw = localStorage.getItem(ACC_KEY);
    if (!raw) {
      const seed = [createDefaultAccount("Bargeld")];
      localStorage.setItem(ACC_KEY, JSON.stringify(seed));
      console.log("[ft_accounts] initialized:", seed);
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = [createDefaultAccount("Bargeld")];
      localStorage.setItem(ACC_KEY, JSON.stringify(seed));
      console.warn("[ft_accounts] invalid/empty → reset to default");
      return seed;
    }
    return parsed;
  } catch {
    const seed = [createDefaultAccount("Bargeld")];
    localStorage.setItem(ACC_KEY, JSON.stringify(seed));
    console.warn("[ft_accounts] parse error → reset to default");
    return seed;
  }
}

// Quick create (replace with modal later)
function createNewAccountInteractive(onPicked) {
  const name = (window.prompt("Kontoname eingeben:", "Neues Konto") || "").trim();
  if (!name) return null;

  const newAcc = createDefaultAccount(name);
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(ACC_KEY) || "[]");
    if (!Array.isArray(list)) list = [];
  } catch { list = []; }

  const next = [...list, newAcc];
  localStorage.setItem(ACC_KEY, JSON.stringify(next));
  if (typeof onPicked === "function") onPicked(newAcc);
  return next;
}

// Rename account inline
function renameAccountInteractive(accId, currentName, onDone) {
  const nextName = (window.prompt("Neuer Kontoname:", currentName) || "").trim();
  if (!nextName || nextName === currentName) return null;

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(ACC_KEY) || "[]");
    if (!Array.isArray(list)) list = [];
  } catch { list = []; }

  const idx = list.findIndex((a) => a.id === accId);
  if (idx === -1) return null;

  list[idx] = { ...list[idx], name: nextName, updatedAt: new Date().toISOString() };
  localStorage.setItem(ACC_KEY, JSON.stringify(list));
  if (typeof onDone === "function") onDone(list[idx], list);
  return list;
}

// Edit opening balance (current balance stays computed)
function editOpeningBalanceInteractive(accId, currentOpening, onDone) {
  const input = window.prompt("Anfangssaldo (EUR):", String(currentOpening ?? 0));
  if (input == null) return null;
  const n = Number(String(input).replace(",", "."));
  if (!Number.isFinite(n)) { alert("Ungültiger Betrag"); return null; }

  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(ACC_KEY) || "[]");
    if (!Array.isArray(list)) list = [];
  } catch { list = []; }

  const idx = list.findIndex((a) => a.id === accId);
  if (idx === -1) return null;

  list[idx] = { ...list[idx], openingBalance: n, updatedAt: new Date().toISOString() };
  localStorage.setItem(ACC_KEY, JSON.stringify(list));
  if (typeof onDone === "function") onDone(list[idx], list);
  return list;
}

// ---------- Page ----------
export default function GuestTransactionStep1() {
  const navigate = useNavigate();

  // global draft (store)
  const {
    amount = "",
    amountCents = 0,
    accountId = "",
    kind = "expense", // "expense" | "income"
  } = useTxDraft();

  // UI state
  const [spinOnce, setSpinOnce] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false); // full accounts list
  const comboboxRef = useRef(null);

  // accounts state (loaded from localStorage)
  const [accounts, setAccounts] = useState([]);

  // derive amount string from store on mount/changes
  const [amountStr, setAmountStr] = useState(
    typeof amount === "number" && amount > 0
      ? (amount).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ""
  );

  // Ensure accounts
  useEffect(() => {
    const accs = ensureAccounts();
    setAccounts(accs);
  }, []);

  // sync external amount → local input
  useEffect(() => {
    if (typeof amount === "number" && amount > 0) {
      setAmountStr(
        amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
    } else if (!amount) {
      setAmountStr("");
    }
  }, [amount]);

  // close combobox on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // compute balances per account from transactions
  const accountsWithBalance = useMemo(() => {
    let tx = [];
    try {
      const raw = localStorage.getItem("ft_transactions");
      const parsed = raw ? JSON.parse(raw) : [];
      tx = Array.isArray(parsed) ? parsed : [];
    } catch { tx = []; }

    return accounts.map((acc) => {
      const sum = tx.reduce((s, t) => {
        if (t && t.kontoId === acc.id && Number.isFinite(t.amount)) {
          return s + t.amount; // incomes +, expenses -
        }
        return s;
      }, 0);
      return { ...acc, balance: (acc.openingBalance || 0) + sum };
    });
  }, [accounts]);

  const totalBalance = useMemo(
    () => accountsWithBalance.reduce((s, a) => s + (a.balance || 0), 0),
    [accountsWithBalance]
  );

  const filtered = query.trim()
    ? accountsWithBalance.filter((a) =>
      a.name.toLowerCase().includes(query.trim().toLowerCase())
    )
    : accountsWithBalance;

  // --- handlers ---
  const onAmountChange = (e) => {
    const v = e.target.value;
    const cleaned = v.replace(/[^\d.,\s]/g, "");
    setAmountStr(cleaned);
  };
  const handleKeyDown = (e) => {
    if (["-", "e", "E", "+"].includes(e.key)) e.preventDefault();
  };
  const handleBlur = () => {
    const cents = toCents(amountStr);
    if (cents <= 0) {
      txDraft.setMany({ amount: 0, amountCents: 0 });
      setAmountStr("");
    } else {
      const euros = cents / 100;
      txDraft.setMany({ amount: euros, amountCents: cents });
      setAmountStr(
        euros.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
    }
  };

  // toggle kind and persist immediately (so Step2 can read it)
  const onKindChange = (nextKind) => {
    txDraft.set("kind", nextKind);
  };

  const onAccountPick = (acc) => {
    txDraft.setMany({ accountId: acc.id, kontoName: acc.name });
    setQuery(acc.name);
    setOpen(false);
  };

  {/* const onGearClick = () => {
    if (spinOnce) return;
    setSpinOnce(true);
    setTimeout(() => setSpinOnce(false), 600);
  }; */}

  // Next → always go to Step2 (datepicker). Step2 decides next page by `kind`.
  const onNext = () => {
    const cents = toCents(amountStr || amount);
    const nowISO = new Date().toISOString();

    txDraft.setMany({
      kind,                     // ensure kind is persisted
      amount: cents / 100,
      amountCents: cents,
      date: nowISO,             // default; user can change on Step2
    });

    navigate("/guestTransactionStep2");
  };



  const derivedCents = toCents(amountStr || amount);
  const hasAccount = useMemo(
    () => accounts.some(a => a.id === accountId),
    [accounts, accountId]
  );


  const canContinue = derivedCents > 0 && !!accountId;


  return (
    <div className="bg-white">

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

          center={<Progress
            step={1}
            total={4}
            className="hidden sm:flex w-[120px]"
            srLabel="Schrittfortschritt"
          />}

          right={
            <Link
              to="/SettingsPage"
              aria-label="Einstellungen"
              className="group p-2 hover:bg-gray-100 transition rounded-lg inline-flex items-center justify-center"
              type="button"
            >
              <Settings className="h-6 w-6 text-gray-600 transition-transform duration-500 group-hover:animate-spin" />
            </Link>
          }
        />

        {/* Step title */}
        <section className="flex-1">
          <h1 className="text-lg text-gray-600 mb-6">
            Transaktion anlegen
          </h1>

          {/* kind toggle */}
          <h2 className="text-center text-black text-base font-medium mb-1">
            Transaktionstyp
          </h2>
          <div className="flex w-full shadow-sm overflow-hidden">
            <button
              type="button"
              aria-pressed={kind === "expense"}
              onClick={() => onKindChange("expense")}
              className={`w-1/2 h-12 text-center font-medium transition border border-gray-400
                ${kind === "expense"
                  ? "bg-blue-400 text-white"
                  : "bg-white text-blue-500 hover:bg-blue-50"
                }`}
            >
              Ausgabe
            </button>
            <button
              type="button"
              aria-pressed={kind === "income"}
              onClick={() => onKindChange("income")}
              className={`w-1/2 h-12 text-center font-medium transition border border-gray-400
                ${kind === "income"
                  ? "bg-blue-400 text-white"
                  : "bg-white text-blue-500 hover:bg-blue-50"
                }`}
            >
              Einnahme
            </button>
          </div>

          {/* amount */}
          <div className="mt-6">
            <h2 className="text-center text-black text-base font-medium mb-1">
              Betrag eingeben
            </h2>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={amountStr}
              onChange={onAmountChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="h-12 w-full border shadow-sm border-gray-400 px-3 placeholder-gray-400 outline-none
               focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-label="Betrag"
            />
            <p className="mt-1 text-xs text-gray-500">
              Nur positive Beträge. Beispiel: 12,99
            </p>
          </div>
        </section>

        {/* account selection */}
        <section className="mt-6" ref={comboboxRef}>
          <h2 className="text-center text-black text-base font-medium mb-1">
            Konto auswählen
          </h2>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <MagnifyingGlass className="w-5 h-5" />
            </span>

            <input
              type="text"
              placeholder="Sparkasse"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="h-12 w-full border shadow-sm border-gray-500/80 pl-9 pr-10
                         outline-none placeholder-gray-400
                         focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls="account-listbox"
              role="combobox"
            />

            {query && (
              <button
                type="button"
                aria-label="Eingabe löschen"
                onClick={() => {
                  setQuery("");
                  setOpen(true);
                }}
                className="absolute inset-y-0 right-2 flex items-center rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <Cross className="w-4 h-4" />
              </button>
            )}
          </div>

          {open && (
            <div
              className="relative z-20"
              role="listbox"
              id="account-listbox"
              aria-label="Kontoliste"
            >
              <ul className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-[#F6F0FF] p-2 shadow">
                {filtered.map((acc) => (
                  <li key={acc.id}>
                    <button
                      type="button"
                      onClick={() => onAccountPick(acc)}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition
                        ${accountId === acc.id ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
                      role="option"
                      aria-selected={accountId === acc.id}
                    >
                      <span className="flex items-center gap-2">
                        <PencilIcon className="w-4 h-4" />
                        <span>{acc.name}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="tabular-nums">{fmtEur(acc.balance || 0)}</span>

                        {/* inline actions */}
                        <button
                          type="button"
                          title="Umbenennen"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedList = renameAccountInteractive(
                              acc.id,
                              acc.name,
                              (updatedAcc, list) => {
                                setAccounts(list);
                                if (accountId === updatedAcc.id) {
                                  txDraft.set("kontoName", updatedAcc.name);
                                  setQuery(updatedAcc.name);
                                }
                              }
                            );
                          }}
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-white"
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          title="Anfangssaldo ändern"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedList = editOpeningBalanceInteractive(
                              acc.id,
                              acc.openingBalance ?? 0,
                              (_, list) => setAccounts(list)
                            );
                          }}
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-white"
                        >
                          Startsaldo
                        </button>
                      </div>
                    </button>
                  </li>
                ))}

                <li className="mt-1 border-t border-gray-200 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      const next = createNewAccountInteractive(onAccountPick);
                      if (next) setAccounts(next);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-white/70 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Neues Konto erstellen</span>
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* Full accounts list toggle */}
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-3 flex items-center gap-2 text-sm text-gray-700 hover:underline"
          >
            <DoubleDownArrow className="w-3 h-3" />
            <span>{showAll ? "Alle Konten verbergen" : "Alle Konten anzeigen"}</span>
          </button>

          {showAll && (
            <div className="mt-3 rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <strong>Kontenübersicht</strong>
                <span className="text-sm text-gray-600">Gesamt: {fmtEur(totalBalance)}</span>
              </div>
              <ul className="divide-y divide-gray-200">
                {accountsWithBalance.map((acc) => (
                  <li key={acc.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{acc.name}</span>
                      {acc.archived && (
                        <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs">Archiv</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums">{fmtEur(acc.balance || 0)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const list = renameAccountInteractive(acc.id, acc.name, (_, l) => setAccounts(l));
                        }}
                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-white"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const list = editOpeningBalanceInteractive(acc.id, acc.openingBalance ?? 0, (_, l) => setAccounts(l));
                        }}
                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-white"
                      >
                        Startsaldo
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-10" />

          <Button
            variant="primary"
            disabled={!canContinue}
            onClick={onNext}
            className={`${!canContinue
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:opacity-95 active:scale-95"
              }`}
          >
            Weiter
          </Button>
        </section>
      </main>
    </div>
  );
}
