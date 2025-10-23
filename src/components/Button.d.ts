import * as React from "react";

type Variant = "primary" | "secondary" | "ghostDim";

type BaseProps = {
    children: React.ReactNode;
    variant?: Variant;
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
};

type LinkVariant = BaseProps & {
    to: string;
    onClick?: never;
    type?: never;
};

type ActionVariant = BaseProps & {
    to?: undefined;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    type?: "button" | "submit" | "reset";
};

declare const Button: React.FC<LinkVariant | ActionVariant>;
export default Button;
