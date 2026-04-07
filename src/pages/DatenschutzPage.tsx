import { useNavigate } from "react-router-dom";
import { impressum } from "../content/impressum";


export default function DatenschutzPage() {
    const navigate = useNavigate();

    return (
        <main className="min-h-screen bg-white px-4 py-10 text-slate-800">
            <div className="mx-auto max-w-3xl bg-white p-6 shadow-sm sm:p-8">

                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 text-sm text-slate-600 hover:text-slate-900"
                >
                    ← Zurück
                </button>

                <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                    Datenschutzerklärung
                </h1>

                <div className="mt-8 space-y-6 text-sm leading-7 sm:text-base">

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            1. Allgemeine Hinweise
                        </h2>
                        <p>
                            Diese Website dient der Bereitstellung einer Anwendung zur Verwaltung persönlicher Finanzen.
                            Der Schutz Ihrer persönlichen Daten ist uns wichtig.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            2. Verantwortlicher
                        </h2>
                        <div className="mt-3 space-y-1 text-slate-700">
                            <p>{impressum.name}</p>
                            <p>{impressum.street}</p>
                            <p>{impressum.city}</p>
                            <p>{impressum.country}</p>
                        </div>
                        <p>
                            E-Mail:{" "}
                            <a
                                href={`mailto:${impressum.email}`}
                                className="text-slate-900 underline underline-offset-4"
                            >
                                {impressum.email}
                            </a>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            3. Datenerfassung
                        </h2>
                        <p>
                            Personenbezogene Daten werden nur erhoben, wenn Sie diese im Rahmen der Nutzung der Anwendung angeben.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            4. Authentifizierung (Login)
                        </h2>
                        <p>
                            Für die Anmeldung kann ein Login über Drittanbieter (z. B. Google) verwendet werden.
                            Dabei werden Daten wie Name und E-Mail-Adresse verarbeitet.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            5. Verwendung von Supabase
                        </h2>
                        <p>
                            Diese Anwendung nutzt Supabase als Backend-Dienstleister zur Speicherung und Verarbeitung von Daten.
                            Die Daten werden auf Servern von Supabase verarbeitet.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            6. Speicherung und Verarbeitung
                        </h2>
                        <p>
                            Die Daten werden ausschließlich zur Bereitstellung der Funktionen der Anwendung verwendet.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            7. Ihre Rechte
                        </h2>
                        <p>
                            Sie haben das Recht auf Auskunft, Berichtigung oder Löschung Ihrer Daten sowie Einschränkung der Verarbeitung.
                        </p>
                    </section>

                </div>
            </div>
        </main>
    );
}