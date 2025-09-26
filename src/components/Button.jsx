import { Link } from "react-router-dom";

/**
 * Reusable Button component
 * Props:
 * - variant: "primary" | "secondary"
 * - icon: React component (optional)
 * - children: button label
 * - onClick: handler
 */
export default function Button({
  children,
  variant = "secondary",
  icon: Icon,
  onClick,
  type = "button",
  to,
  disabled = false,
  loading = false,
}) {
  const baseStyle =
    "relative h-12 w-full border shadow-sm px-5 text-base flex items-center";
  const variants = {
    primary: baseStyle + " border-gray-400 bg-blue-400 text-white hover:opacity-95",
    secondary: baseStyle + " border-gray-400 bg-white text-blue-500 hover:bg-gray-50",
    ghostDim: baseStyle + " border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200",
  };

  const disabledStyle = "opacity-50 cursor-not-allowed pointer-events-none";

  const iconStyle = "absolute left-10 size-5 block self-center";

  const labelStyle = "block w-full text-center leading-none self-center";

  const content = loading ? (
    <span className={labelStyle}>Lädt…</span>
  ) : (<>
    {Icon && <Icon className={iconStyle} aria-hidden />}
    <span className={labelStyle}>{children}</span>
  </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`${variants[variant]} ${disabled ? disabledStyle : ""}`}
        aria-disabled={disabled}
        onClick={(e) => disabled && e.preventDefault()}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${variants[variant]} ${disabled ? disabledStyle : ""}`}
      disabled={disabled}            // Block
      aria-disabled={disabled}
    >
      {content}
    </button>
  );
}
