type ProgressProps = {
    step: number;
    total: number;
    className?: string;
    srLabel?: string;
};

export default function Progress({
    step,
    total,
    className = "",
    srLabel = "Fortschritt",
}: ProgressProps) {
    const pct = Math.max(0, Math.min(100, (step / total) * 100));

    return (
        <div
            className={`flex flex-col items-center justify-center gap-1 ${className}`}
            role="progressbar"
            aria-label={srLabel}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={step}
        >
            <span className="text-xs text-gray-600">
                Schritt {step} von {total}
            </span>

            <div className="w-full h-1 bg-gray-200 rounded overflow-hidden">
                <div
                    className="h-full bg-blue-400 transition-all duration-500 ease-in-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}
