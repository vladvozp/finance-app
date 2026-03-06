import React from "react";
import {
    Home, ShoppingBasket, Car, Smartphone, HeartPulse, Shirt,
    GraduationCap, Baby, Clapperboard, Luggage, Wallet, Folder,
    CircleHelp, LogOut, HelpCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconSpec = { kind: "lucide" | "emoji"; value: string; color?: string };

const ICON_MAP: Record<string, LucideIcon> = {

    Home, ShoppingBasket, Car, Smartphone, HeartPulse, Shirt,
    GraduationCap, Baby, Clapperboard, Luggage, Wallet, Folder,
    CircleHelp, HelpCircle, LogOut,
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

    const Icon = ICON_MAP[icon.value?.trim()] ?? CircleHelp;

    return (
        <Icon
            className={className}
            color={icon.color}
            aria-label={title}
            role="img"
        />
    );
}