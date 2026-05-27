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

                <p className="mt-2 text-sm text-slate-500">Stand: April 2026</p>

                <div className="mt-8 space-y-8 text-sm leading-7 sm:text-base">
                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            1. Allgemeine Hinweise
                        </h2>
                        <p className="mt-3">
                            Diese Anwendung dient der Verwaltung persönlicher Finanzdaten.
                            Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen.
                            Wir verarbeiten personenbezogene Daten ausschließlich im Rahmen der
                            gesetzlichen Vorschriften der Datenschutz-Grundverordnung (DSGVO).
                        </p>
                        <p className="mt-3">
                            Personenbezogene Daten werden einerseits erhoben, wenn Sie diese
                            selbst im Rahmen der Nutzung der Anwendung angeben, und
                            andererseits teilweise automatisch durch die technische
                            Bereitstellung der Website verarbeitet, zum Beispiel IP-Adresse,
                            Zeitstempel und technische Logdaten.
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
                        <p className="mt-3">
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
                            3. Zwecke und Rechtsgrundlagen der Verarbeitung
                        </h2>
                        <p className="mt-3">
                            Die Verarbeitung Ihrer personenbezogenen Daten erfolgt zu folgenden
                            Zwecken:
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-6">
                            <li>Bereitstellung und Betrieb der Anwendung</li>
                            <li>Verwaltung von Benutzerkonten</li>
                            <li>Speicherung und Verarbeitung von vom Nutzer eingegebenen Finanzdaten</li>
                            <li>Sicherstellung der technischen Stabilität und Sicherheit</li>
                        </ul>
                        <p className="mt-3">Rechtsgrundlagen:</p>
                        <ul className="mt-3 list-disc space-y-1 pl-6">
                            <li>
                                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bzw. Durchführung
                                vorvertraglicher Maßnahmen)
                            </li>
                            <li>
                                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an sicherem
                                und stabilem Betrieb)
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            4. Registrierung und Login
                        </h2>
                        <p className="mt-3">
                            Für die Nutzung der Anwendung ist eine Anmeldung erforderlich.
                        </p>
                        <p className="mt-3">Dabei werden folgende Daten verarbeitet:</p>
                        <ul className="mt-3 list-disc space-y-1 pl-6">
                            <li>E-Mail-Adresse</li>
                            <li>ggf. Name (bei Nutzung eines Drittanbieters wie Google Login)</li>
                        </ul>
                        <p className="mt-3">
                            Diese Daten dienen ausschließlich der Bereitstellung und
                            Verwaltung Ihres Benutzerkontos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            5. Verarbeitung von Nutzerdaten (Finanzdaten)
                        </h2>
                        <p className="mt-3">
                            Im Rahmen der Nutzung der Anwendung können Sie eigene Daten
                            eingeben, insbesondere:
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-6">
                            <li>Einnahmen und Ausgaben</li>
                            <li>Konten</li>
                            <li>Kategorien und Notizen</li>
                        </ul>
                        <p className="mt-3">
                            Diese Daten werden ausschließlich zur Bereitstellung der
                            Funktionen der Anwendung gespeichert und verarbeitet.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            6. Einsatz von Supabase
                        </h2>
                        <p className="mt-3">
                            Diese Anwendung nutzt Supabase als technischen Dienstleister für
                            Authentifizierung, Datenbank und backendnahe Funktionen.
                        </p>
                        <p className="mt-3">
                            Die Verarbeitung erfolgt zum Zweck der Bereitstellung und sicheren
                            Nutzung der Anwendung.
                        </p>
                        <p className="mt-3">
                            Supabase handelt als Auftragsverarbeiter im Sinne der DSGVO. Mit
                            dem Anbieter wurde ein Vertrag zur Auftragsverarbeitung (DPA)
                            abgeschlossen.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            7. Hosting und Server-Logdateien
                        </h2>
                        <p className="mt-3">
                            Beim Aufruf dieser Website werden automatisch technische Daten
                            erfasst, darunter:
                        </p>
                        <ul className="mt-3 list-disc space-y-1 pl-6">
                            <li>IP-Adresse</li>
                            <li>Datum und Uhrzeit der Anfrage</li>
                            <li>Browsertyp und Betriebssystem</li>
                            <li>aufgerufene Seiten</li>
                        </ul>
                        <p className="mt-3">
                            Diese Daten sind erforderlich, um die Website technisch
                            bereitzustellen und die Systemsicherheit zu gewährleisten.
                        </p>
                        <p className="mt-3">
                            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            8. Speicherung und Speicherdauer
                        </h2>
                        <p className="mt-3">
                            Ihre personenbezogenen Daten werden nur so lange gespeichert, wie
                            dies für die jeweiligen Zwecke erforderlich ist.
                        </p>
                        <p className="mt-3">
                            Benutzerkonten und damit verbundene Daten werden gespeichert,
                            solange das Konto aktiv ist. Nach Löschung des Kontos werden die
                            Daten im Rahmen der gesetzlichen Vorschriften gelöscht.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            9. Technische Speicherung (Local Storage / Cookies)
                        </h2>
                        <p className="mt-3">
                            Die Anwendung kann technisch notwendige Speichermechanismen
                            verwenden, zum Beispiel Local Storage, um die Funktionalität der
                            Anwendung sicherzustellen, etwa für Sitzungsverwaltung oder
                            Einstellungen.
                        </p>
                        <p className="mt-3">
                            Diese Speicherung ist für den Betrieb der Anwendung erforderlich.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            10. Ihre Rechte
                        </h2>
                        <p className="mt-3">Sie haben folgende Rechte:</p>
                        <ul className="mt-3 list-disc space-y-1 pl-6">
                            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                            <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                            <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                            <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                            <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            11. Beschwerderecht
                        </h2>
                        <p className="mt-3">
                            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
                            über die Verarbeitung Ihrer personenbezogenen Daten zu
                            beschweren.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            12. Änderungen dieser Datenschutzerklärung
                        </h2>
                        <p className="mt-3">
                            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um
                            sie stets an aktuelle rechtliche Anforderungen oder Änderungen der
                            Anwendung anzupassen.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            13. Social Media
                        </h2>

                        <p className="mt-2 text-slate-700">
                            Ich nutze Social-Media-Profile, insbesondere TikTok.
                            Wenn Nutzer meine Social-Media-Profile besuchen, mit Beiträgen interagieren,
                            Kommentare schreiben oder mir Nachrichten senden, können personenbezogene Daten
                            verarbeitet werden.
                        </p>

                        <p className="mt-2 text-slate-700">
                            Die Verarbeitung erfolgt teilweise durch mich, soweit ich Nachrichten,
                            Kommentare oder Interaktionen sehe und beantworte. Darüber hinaus verarbeitet
                            die jeweilige Plattform personenbezogene Daten nach ihren eigenen
                            Datenschutzbestimmungen.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            14. Affiliate-Links / TikTok Shop
                        </h2>

                        <p className="mt-2 text-slate-700">
                            Auf meinen Social-Media-Profilen können Affiliate-Links, Produktlinks oder
                            TikTok-Shop-Links eingebunden sein.
                        </p>

                        <p className="mt-2 text-slate-700">
                            Wenn Nutzer über einen solchen Link ein Produkt kaufen, kann ich eine
                            Provision erhalten. Für Nutzer entstehen dadurch keine zusätzlichen Kosten.
                        </p>

                        <p className="mt-2 text-slate-700">
                            Die Abwicklung des Kaufs erfolgt über die jeweilige Plattform bzw. den
                            jeweiligen Anbieter. Ich selbst bin nicht Verkäufer der Produkte und habe
                            keinen Einfluss auf Zahlungsabwicklung, Versand, Rückgabe oder die weitere
                            Datenverarbeitung durch die Plattform oder den Verkäufer.
                        </p>

                        <p className="mt-2 text-slate-700">
                            Beiträge mit kommerziellem Bezug werden als Werbung oder Anzeige gekennzeichnet.
                        </p>
                    </section>

                </div>
            </div>
        </main>
    );
}