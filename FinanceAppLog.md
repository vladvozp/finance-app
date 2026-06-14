# KlarSIO_LOG.md

## CURRENT / AKTUELL

**Stand:** 14.06.2026
**Aktueller Fokus:** Routing-Bug beheben

### Aktuelles Problem

Wenn der Benutzer bereits autorisiert ist und nur die Hauptdomain öffnet:

```text
/
```

wird er nicht automatisch auf die Arbeitsseite weitergeleitet.

Aktuell muss man manuell eine Seite eingeben, zum Beispiel:

```text
/MonthPage
```

### Gewünschtes Verhalten

```text
Nicht eingeloggt + /        → LoginPage
Eingeloggt + /              → MonthPage
Eingeloggt + /MonthPage     → MonthPage
```

### Nächster konkreter Schritt

1. Projekt öffnen.
2. App starten.
3. Routing-Datei finden.
4. Prüfen, ob es eine Route für `/` gibt.
5. Auth-State finden: `user`, `session`, `loading`.
6. Redirect für `/` einbauen.
7. Testen.
8. Commit machen.

### Suchbegriffe im Projekt

```text
BrowserRouter
Routes
Route
Navigate
MonthPage
LoginPage
supabase.auth
session
user
```

### Entscheidung

Vor neuen Analytics-Features zuerst den Routing-Bug schließen.

---

## BACKLOG / SPÄTER

### Analytics

Erst nach dem Routing-Bug weiter mit Analytics.

Aktueller Ansatz:

* Noch kein komplexes `Scope → Group → Category` System.
* Business-Ausgaben erstmal als eigene Gruppe behandeln.
* Analytics soll zuerst Summen nach Gruppen zeigen.
* Danach bei Klick auf Gruppe Kategorien und Summen anzeigen.

Beispiel:

```text
Gruppe | Summe | Anzahl
```

Dann:

```text
Kategorie | Summe | Anzahl
```

Business-Gruppe:

```text
Business
- Software
- AI Tools
- Marketing
- Equipment
- Reisekosten
```

---

## LOG HISTORY

### 14.06.2026

#### Kontext

Projekt: **KlarSIO**
Bereich: **React / TypeScript / Supabase / SQL / Analytics**

Letzter Fokus war die **Analytics-Seite**.
Danach wurde klar: Vor neuen Features muss zuerst ein konkreter Bug im Routing behoben werden.

#### Bug erkannt

Wenn der Benutzer bereits autorisiert ist und nur die Hauptdomain `/` öffnet, wird er nicht automatisch auf `/MonthPage` weitergeleitet.

#### Vermutliche Ursache

Vermutlich fehlt im React Router eine saubere Route für:

```text
path="/"
```

oder diese Route prüft den Auth-Status nicht korrekt.

Mögliche Dateien:

```text
App.tsx
router.tsx
routes.tsx
main.tsx
```

#### Geplanter Fix

Eine Start-Route `/` erstellen oder korrigieren.

Beispiellogik:

```tsx
<Route
  path="/"
  element={
    loading ? (
      <div>Loading...</div>
    ) : user ? (
      <Navigate to="/MonthPage" replace />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
```

Wichtig: Wenn Supabase den Auth-Status asynchron lädt, muss zuerst `loading` geprüft werden.

#### Alternative Struktur

Optional einen eigenen Redirect-Component erstellen:

```tsx
function HomeRedirect({ user, loading }) {
  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/MonthPage" replace />;
  }

  return <Navigate to="/login" replace />;
}
```

Dann in den Routes:

```tsx
<Route path="/" element={<HomeRedirect user={user} loading={loading} />} />
```

#### Ziel der Woche für KlarSIO

Mindestziel:

```text
/ → automatische Weiterleitung
```

Gutes Ziel:

```text
Analytics zeigt Summen nach Gruppen
```

Sehr gutes Ziel:

```text
Bei Klick auf Gruppe werden Kategorien und Summen angezeigt
```

#### Notiz

Nicht mit großer Architektur anfangen.
Zuerst einen echten Bug schließen.
Dann kleine Analytics-Funktion erweitern.

Prinzip:

```text
kleiner Fix → testen → commit → nächster kleiner Schritt
```
