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
export function GuestLoginButton({ onClick  }) {
  return (
    <Button variant="ghostDim" onClick={onClick }>
      Ohne Anmeldung testen
    </Button>
  );
}
