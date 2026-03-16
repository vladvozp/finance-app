// src/utils/currency.ts

export const fmtEur = (n: number): string =>
    new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
    }).format(n);

/*export const toCents = (s: string | number): number => {
    if (!s && s !== 0) return 0;
    const cleaned = String(s)
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
}; */


export const toCents = (s: string | number): number => {
    if (!s && s !== 0) return 0;
    const cleaned = String(s)
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", ".");
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return 0;
    const MAX_EUROS = 999_999_999.99;
    const clamped = Math.min(n, MAX_EUROS);
    if (clamped < 0) return 0;

    return Math.round(clamped * 100);
};