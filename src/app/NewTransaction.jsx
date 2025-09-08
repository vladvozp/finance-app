import { useNavigate } from "react-router-dom";

export default function NewTransaction() {
  const nav = useNavigate();
  return (
    <div>
      <h1>Neue Transaction</h1>
      <button onClick={() => nav("/transactions")}>Speichern (Test)</button>
    </div>
  );
}
