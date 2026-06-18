# KlarSIO_LOG.md
## Was wurde gemacht?

18.06.2026

Protected Routes umgesetzt.
Geschützte Seiten sind jetzt nur nach Anmeldung erreichbar.
Ohne Login soll der Nutzer nicht in den internen Bereich der App gelangen.
Layout überarbeitet.
Anpassung für große Bildschirme hinzugefügt.
Die Desktop-Version ist nicht mehr auf eine schmale mobile Breite begrenzt.
Die mobile Darstellung bleibt weiterhin responsiv.
Testbereich für Analytics-Diagramme hinzugefügt.
Recharts eingebunden.
Ein erstes Testdiagramm erstellt.
Adaptive Darstellung der Charts/Diagramme auf der Analytics-Seite geprüft.

Aktueller Stand
Version 0.5 ist fast abgeschlossen. Die wichtigsten Punkte aus der Liste wurden umgesetzt.
Der nächste wichtige Schritt ist ein konkreter Test der neuen Funktionen und die Sicherung einer stabilen Recharts-Version.


### Nächster Schritt

Konkreten App-Test durchführen:
Login ohne aktive Sitzung prüfen;
Login mit aktiver Sitzung prüfen;
Zugriff auf geschützte Seiten testen;
Layout auf mobilen Geräten prüfen;
Layout auf großen Bildschirmen prüfen;
Analytics-Seite öffnen und kontrollieren;
Recharts-Testdiagramm prüfen.
Stabile Recharts-Version sichern:
installierte Version prüfen;
sicherstellen, dass der Build ohne Fehler läuft;
Deployment auf Vercel prüfen;
funktionierende Version als stabile Basis festhalten.
Nach dem Test:
gefundene Fehler korrigieren;
stabile Version committen;
v0.5 als funktionierende Grundlage für die weitere Entwicklung markieren

### Stop-Punkt

Weiter in der Routing-Datei

## BACKLOG / SPÄTER

### Analytics

Erst nach RootGate-Fix und ProtectedRoute-Schutz weiter mit Analytics.

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


### 16.06.2026

**Stand:** 16.06.2026  
**Aktueller Fokus:** Private Routen absichern


Der Routing-Bug für die Hauptdomain `/` wurde behoben.

Wenn ein Benutzer bereits mit Google autorisiert ist und nur die Hauptdomain öffnet, bleibt die Anwendung nicht mehr bei `Loading...` hängen. `RootGate` prüft die Session korrekt und leitet weiter.

Neues Problem:

Wenn ein Benutzer **nicht eingeloggt** ist und eine private Seite direkt öffnet, zeigt die Anwendung teilweise eine leere Seite.

Beispiel:

```text
/MonthPage
```

```text
Nicht eingeloggt + /            → LoginPage
Nicht eingeloggt + /MonthPage   → LoginPage
Nicht eingeloggt + /setup       → LoginPage

Eingeloggt + /                  → MonthPage
Eingeloggt + /MonthPage         → MonthPage
Eingeloggt ohne Accounts + /    → Setup
```

### Nächster konkreter Schritt

1. Prüfen, welche Routen privat sind.
2. `ProtectedRoute` erstellen.
3. `/MonthPage` mit `ProtectedRoute` schützen.
4. `/setup` mit `ProtectedRoute` schützen.
5. Weitere private Seiten prüfen: Analytics, Settings, Accounts.
6. Ohne Login direkte URLs testen.
7. Mit Login normale Weiterleitung testen.
8. Danach Commit machen.

### Suchbegriffe im Projekt

```text
Routes
Route
Navigate
ProtectedRoute
MonthPage
Setup
LoginPage
supabase.auth.getSession
onAuthStateChange
```

### Entscheidung

RootGate ist repariert.  
Vor neuen Analytics-Features zuerst private Routen absichern, damit nicht eingeloggte Benutzer nicht auf leere oder interne Seiten gelangen.

---

#### Kontext

Projekt: **KlarSIO**  
Bereich: **React / Supabase Auth / Routing**

#### RootGate-Fix abgeschlossen

Die Route für die Hauptdomain `/` ist vorhanden:

```tsx
{ path: "/", element: <RootGate /> }
```

Das Problem war nicht die fehlende Route, sondern ein Hängenbleiben im `RootGate`.

Bei aktiver Google-Session blieb die Anwendung auf der Hauptdomain im Zustand:

```text
Loading...
```

#### Ursache

Die Ursache lag vermutlich in der Auth-Logik:

```tsx
supabase.auth.onAuthStateChange(async (event) => {
  await checkUserAndAccounts();
});
```

Innerhalb von `onAuthStateChange` wurde erneut `getSession()` aufgerufen. Nach Google Auth konnte das zu einem dauerhaften Loading-Zustand führen.

#### Fix

Die Logik wurde angepasst:

* `getSession()` wird beim Initialisieren geprüft.
* In `onAuthStateChange` wird die vorhandene `session` aus dem Event verwendet.
* `setLoading(false)` wird zuverlässig im `finally`-Block gesetzt.
* Fehler beim Laden von Accounts oder Dictionaries blockieren die App nicht dauerhaft.

#### Ergebnis

```text
Eingeloggt + / → RootGate → MonthPage
```

Die Hauptdomain funktioniert wieder korrekt.

#### Neues Problem erkannt

Ohne Login zeigt eine direkte private Route aktuell teilweise eine leere Seite.

Beispiel:

```text
/MonthPage
```

#### Nächster Fix

Eine `ProtectedRoute` für private Seiten erstellen.

Ziel:

```text
Nicht eingeloggt + private Route → /login
```

---

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
