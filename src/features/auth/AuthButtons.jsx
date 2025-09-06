import Button from "../../components/Button";
import VectorGoogle from "../../assets/VectorGoogle.svg?react";

// Button "Mit Google anmelden"
export function GoogleLoginButton({ onClick, disabled, loading }) {
  return (
    <Button
      variant="secondary"
      icon={VectorGoogle}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      Mit Google anmelden
    </Button>
  );
}

// Button "Ohne Anmeldung testen"
export function GuestLoginButton({ to }) {
  return (
    <Button
      variant="link"
      to={to}
    >
      Ohne Anmeldung testen
    </Button>
  );
}
