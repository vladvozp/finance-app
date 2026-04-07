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

                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
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
                </div>
            </div>
        </main>
    );
}