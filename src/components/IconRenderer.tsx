import React, { lazy, Suspense, useMemo, useId } from "react";
import type { ComponentType, SVGProps } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

export type IconSpec = { kind: "lucide" | "emoji"; value: string; color?: string };

function toKebab(name: string) {
    return name
        .replace(/[_\s]+/g, "-")
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();
}


const ALIASES: Record<string, string> = {
    CircleHelp: "circle-help",
    HelpCircle: "help-circle",
    LogOut: "log-out",
};

export function IconRenderer({
    icon,
    className = "w-4 h-4",
    title,
}: {
    icon?: IconSpec;
    className?: string;
    title?: string;
}) {
    if (!icon) return null;

    if (icon.kind === "emoji") {
        return (
            <span className={className} aria-label={title ?? "icon"} title={title}>
                {icon.value}
            </span>
        );
    }

    const raw = icon.value?.trim() || "circle-help";
    const kebab =
        ALIASES[raw as keyof typeof ALIASES] ?? toKebab(raw);

    const importer =
        dynamicIconImports[kebab as keyof typeof dynamicIconImports] ??
        dynamicIconImports["help-circle" as keyof typeof dynamicIconImports] ??
        dynamicIconImports["circle-help" as keyof typeof dynamicIconImports];

    const LucideIcon = useMemo(
        () =>
            lazy(async () => {
                const mod = await importer();
                return {
                    default: (mod as { default: ComponentType<SVGProps<SVGSVGElement>> })
                        .default,
                };
            }),
        [importer]
    );
    const id = useId();
    return (
        <Suspense fallback={<span className={className} />}>

            <LucideIcon aria-labelledby={id} role="img" className={className}>
                {title && <title id={id}>{title}</title>}
            </LucideIcon>
        </Suspense>
    );
}
