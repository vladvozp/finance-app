import { impressum } from "../content/impressum";
import { useNavigate } from "react-router-dom";

export default function ImpressumPage() {
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
                    Impressum
                </h1>

                <div className="mt-8 space-y-8 text-sm leading-7 sm:text-base">
                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Angaben gemäß § 5 DDG
                        </h2>
                        <div className="mt-3 space-y-1 text-slate-700">
                            <p>{impressum.name}</p>
                            <p>{impressum.street}</p>
                            <p>{impressum.city}</p>
                            <p>{impressum.country}</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">Kontakt</h2>
                        <div className="mt-3 space-y-1 text-slate-700">
                            <p>
                                E-Mail:{" "}
                                <a
                                    href={`mailto:${impressum.email}`}
                                    className="text-slate-900 underline underline-offset-4"
                                >
                                    {impressum.email}
                                </a>
                            </p>
                            <p>
                                Telefon:{" "}
                                <a
                                    href={`tel:${impressum.phone.replace(/\s+/g, "")}`}
                                    className="text-slate-900 underline underline-offset-4"
                                >
                                    {impressum.phone}
                                </a>
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Verantwortlich für den Inhalt
                        </h2>
                        <div className="mt-3 space-y-1 text-slate-700">
                            <p>{impressum.name}</p>
                            <p>{impressum.street}</p>
                            <p>{impressum.city}</p>
                            <p>{impressum.country}</p>
                        </div>
                    </section>


                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Haftung für Inhalte
                        </h2>
                        <p className="mt-3">
                            Als Diensteanbieter sind wir gemäß § 7 Abs.1 DDG für eigene Inhalte
                            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                            Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
                            verpflichtet, übermittelte oder gespeicherte fremde Informationen
                            zu überwachen oder nach Umständen zu forschen, die auf eine
                            rechtswidrige Tätigkeit hinweisen.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            EU-Streitschlichtung
                        </h2>
                        <p className="mt-3">
                            Die Europäische Kommission stellt eine Plattform zur
                            Online-Streitbeilegung (OS) bereit:
                            <a
                                href="https://ec.europa.eu/consumers/odr/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-slate-900 underline underline-offset-4 break-all"
                            >
                                https://ec.europa.eu/consumers/odr/
                            </a>
                        </p>
                        <p className="mt-3">
                            Wir sind nicht verpflichtet und nicht bereit, an
                            Streitbeilegungsverfahren vor einer
                            Verbraucherschlichtungsstelle teilzunehmen.
                        </p>
                    </section>
                    <section>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Social Media
                        </h2>

                        <p className="mt-2 text-slate-700">
                            Dieses Impressum gilt auch für folgende Social-Media-Profile:
                        </p>

                        <div className="mt-3 space-y-1 text-slate-700">
                            {impressum.TikTok && <p>TikTok: {impressum.TikTok}</p>}
                            {impressum.YouTube && <p>YouTube: {impressum.YouTube}</p>}
                            {impressum.Instagram && <p>Instagram: {impressum.Instagram}</p>}
                        </div>

                        <p className="mt-3 text-slate-700">
                            Auf diesen Profilen können Produktlinks, Affiliate-Links oder TikTok-Shop-Links eingebunden sein.
                        </p>
                    </section>

                </div>
            </div>
        </main>
    );
}