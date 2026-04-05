import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

type EntryCardProps = {
    to: string;
    title: string;
    subtitle: string;
    Icon: LucideIcon;
    theme: "income" | "expense";
};

const styles = {
    income: {
        card: "border-green-200 bg-green-50",
        iconWrap: "bg-green-100 text-green-700",
        arrow: "text-green-700",
    },
    expense: {
        card: "border-red-200 bg-red-50",
        iconWrap: "bg-red-100 text-red-700",
        arrow: "text-red-700",
    },
};

export function EntryCard({
    to,
    title,
    subtitle,
    Icon,
    theme,
}: EntryCardProps) {
    const s = styles[theme];

    return (
        <Link
            to={to}
            className={`group flex w-full items-center gap-5 rounded-xl border px-2 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${s.card}`}
        >
            <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${s.iconWrap}`}
            >
                <Icon size={25} strokeWidth={2.2} />
            </div>

            <div className="min-w-0 flex-1">
                <div className="font-semibold leading-tight tracking-tight text-slate-800 text-base sm:text-lg">
                    {title}
                </div>
                <div className="mt-1 text-base leading-snug text-slate-500 sm:text-sm">
                    {subtitle}
                </div>
            </div>

            <ChevronRight
                className={`shrink-0 transition-transform duration-200 group-hover:translate-x-1 ${s.arrow}`}
                size={25}
                strokeWidth={2.2}
            />
        </Link>
    );
}