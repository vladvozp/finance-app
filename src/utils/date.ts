// src/utils/date.ts

export function toISODate(d = new Date()): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export function isFutureISO(isoDate: string): boolean {
    return isoDate > toISODate();
}