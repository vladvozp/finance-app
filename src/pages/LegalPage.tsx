export default function LegalPage() {
    return (
        <main className="mx-auto max-w-3xl px-4 py-10">
            <section className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">
                    Rechtliche Hinweise
                </h1>

                <p className="mt-3 text-slate-700">
                    Hier findest du rechtliche Informationen zu dieser Website und den
                    verbundenen Social-Media-Profilen.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">

                    <a
                        href="/impressum"
                        className="min-w-0 rounded-2xl border border-slate-200 p-5 transition hover:bg-slate-50 hover:shadow-sm"
                    >
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
                            Impressum
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 break-words">
                            Anbieterkennzeichnung gemäß § 5 DDG.
                        </p>
                    </a>

                    <a
                        href="/datenschutz"
                        className="min-w-0 rounded-2xl border border-slate-200 p-5 transition hover:bg-slate-50 hover:shadow-sm"
                    >
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
                            Datenschutzerklärung
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 break-words">
                            Informationen zur Verarbeitung personenbezogener Daten.
                        </p>
                    </a>

                </div>

                <section className="mt-8 rounded-2xl border border-slate-200 p-5">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
                        Social Media / Affiliate
                    </h2>

                    <p className="mt-2 text-slate-700">
                        Diese rechtlichen Hinweise gelten auch für meine Social-Media-Profile,
                        insbesondere TikTok. Auf diesen Profilen können Produktlinks,
                        Affiliate-Links oder TikTok-Shop-Links eingebunden sein.
                    </p>

                    <p className="mt-2 text-slate-700">
                        Beiträge mit kommerziellem Bezug werden als Werbung oder Anzeige
                        gekennzeichnet.
                    </p>
                </section>
            </section>
        </main>
    );
}