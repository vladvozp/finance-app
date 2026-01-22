# MVP v0.2

## Ziel der Version
v0.2 verwandelt die Anwendung von einer einfachen Transaktionsverwaltung
in ein Werkzeug für einen schnellen Überblick über den finanziellen Zustand
eines Monats auf einem einzigen Bildschirm.
Der Nutzer sieht sofort, wie viel Geld ausgegeben wurde, welche Zahlungen
noch ausstehen und welcher Betrag tatsächlich verfügbar ist – bei minimalem
Aufwand für die Eingabe neuer Transaktionen.

---

## Haupt-Nutzerszenario
Der Nutzer öffnet die App und landet direkt auf dem Dashboard des aktuellen Monats.
Er sieht die Monatstabelle, eine finanzielle Übersicht und die Möglichkeit,
sofort eine Transaktion hinzuzufügen.
Mit wenigen Schritten trägt er eine Zahlung ein und erkennt unmittelbar,
wie sie sein Budget beeinflusst.
Gefühl: „Ich sehe den gesamten Monat und habe mein Budget unter Kontrolle.“

---

## Funktionen in v0.2
- Monats-Dashboard als Startansicht
- Monatstabelle mit allen Transaktionen
- Anzeige von:
  - ausgegebenem Geld
  - ausstehenden Zahlungen
  - verfügbaren Mitteln
- Vereinfachte Eingabe von Transaktionen (2 Schritte statt 5)
- Standardkonto als Vorauswahl
- Datumsauswahl für Transaktionen
- Ausstehende Zahlungen (Pending)
- Wiederkehrende Zahlungen (automatisch)
- Gruppen und Kategorien
- Notizen zu Transaktionen
- Wechsel zwischen Monaten
- Nativer Filter für Transaktionen:
  - abgeschlossen
  - ausstehend

---

## Bewusst NICHT enthalten in v0.2
- Diagramme und Auswertungen
- Import von Bankdaten
- AI-basierte Empfehlungen oder Prognosen

---

## Technisches Minimum (zwingend erforderlich)
- Korrekte Berechnung von:
  - Ausgaben
  - ausstehenden Zahlungen
  - verfügbarem Betrag
- Saubere Logik für ausstehende Zahlungen
- Zuverlässige Datenspeicherung
- Automatisches Speichern ohne Datenverlust
- Stabile, flüssige Benutzeroberfläche ohne Verzögerungen

---

## Abschlusskriterien für v0.2
- Ausstehende Zahlungen funktionieren korrekt und sind klar gekennzeichnet
- Ausstehende Zahlungen können:
  - bearbeitet
  - abgeschlossen
  - gelöscht werden
- Die Version läuft stabil ohne kritische Fehler
- Es werden keine neuen Features mehr für v0.2 hinzugefügt
- UI-Anforderungen:
  - Monatliches Blättern ist beim Start verfügbar
  - Die Tabelle verhält sich stabil (ähnlich wie in XLS, kein Verrutschen)
  - Lange Texte werden gekürzt oder die Schriftgröße passt sich an

---

## Übergang zu v0.3
v0.3 dient der Überprüfung der Hypothese eines kostenpflichtigen Produkts:
Die Version soll Zeit sparen, ein reales Problem lösen
und ein dopaminverstärkendes Gefühl von Nutzen und Kontrolle erzeugen.
