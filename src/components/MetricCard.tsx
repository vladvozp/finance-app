type MetricCardProps = {
    title: string;
    value: string;
    hint?: string;
    tone?: "neutral" | "red" | "yellow" | "green";
    featured?: boolean;
};

export default function MetricCard({
    title,
    value,
    hint,
    tone = "neutral",
    featured = false,
}: MetricCardProps) {
    const toneMap = {
        neutral: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-gray-900",
            hint: "text-gray-500",
        },
        red: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-red-700",
            hint: "text-gray-500",
        },
        yellow: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-yellow-700",
            hint: "text-gray-500",
        },
        green: {
            wrap: "border-gray-300 bg-white",
            title: "text-gray-700",
            value: "text-green-700",
            hint: "text-gray-500",
        },
    };

    const c = toneMap[tone];

    return (
        <section className={`min-w-0 border px-4 py-4 ${c.wrap}`}>
            <div className={`text-[11px] font-medium uppercase tracking-wide ${c.title}`}>
                {title}
            </div>

            <div
                className={[
                    "mt-2 min-w-0 truncate font-semibold tabular-nums tracking-tight",
                    featured
                        ? `text-3xl sm:text-4xl ${c.value}`
                        : `text-2xl ${c.value}`,
                ].join(" ")}
                title={value}
            >
                {value}
            </div>

            {hint ? (
                <p className={`mt-2 text-sm leading-6 ${c.hint}`}>
                    {hint}
                </p>
            ) : null}
        </section>
    );
}