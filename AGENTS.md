# AGENTS.md – Foodora Reboot

> Diese Datei ist die verbindliche Arbeitsanweisung für jeden Agenten (GSD2, Claude Code o.ä.),
> der an diesem Repository arbeitet. Sie gilt für **jeden Milestone (M1–MX)**, nicht nur für den,
> in dem sie angelegt wurde. Änderungen an dieser Datei sind additiv – bestehende Regeln werden
> nicht rückwirkend so verändert, dass bereits gemergter Code dagegen verstößt.

---

## 1. Kontext-Dokumente

Vor Beginn jeder Arbeit an diesem Projekt lesen:

- **`foodora-tauri2-roadmap.md`** (Projekt-Root) – North Star, Architektur, Leitplanken
  (Determinismus vor KI, Mobile-First, kein Chat-Interface für KI, Security & Performance
  pro Milestone), Milestone-Übersicht mit Key Requirements
- **`design.md`** (Projekt-Root) – verbindliches Design-System: Farb-Tokens, Typografie-Tokens,
  Spacing-/Grid-System. Jede UI-Komponente referenziert ausschließlich diese Tokens, keine
  Hex-/Pixel-Literale direkt in Komponenten.
- Der jeweils aktuelle **Milestone-Prompt** (z.B. `M1-fundament.md`) für den konkreten Scope

Diese Datei (`AGENTS.md`) beschreibt **wie** gearbeitet wird (Code-Qualität, Git-Workflow,
Deployment). Die Roadmap beschreibt **was** gebaut wird. Beide zusammen ersetzen wiederholte
Kontext-Erklärungen in jedem einzelnen Milestone-Prompt.

---

## 2. Clean-Code-Anweisungen

- **Kleine, fokussierte Einheiten:** Funktionen/Komponenten tun eine Sache. Wenn eine Funktion
  nicht in 1–2 Sätzen beschrieben werden kann, ist sie wahrscheinlich zu groß.
- **Sprechende Namen statt Kommentare.** Ein Kommentar erklärt *warum*, nie *was* – wenn das
  *was* nicht aus dem Code selbst lesbar ist, ist der Code umzubenennen/umzustrukturieren statt
  zu kommentieren.
- **Keine toten Code-Pfade.** Auskommentierter Code, ungenutzte Imports/Variablen und
  „vielleicht später"-Abstraktionen werden vor jedem Commit entfernt.
- **Konsistenz vor Kreativität.** Bestehende Patterns im Repo (Ordnerstruktur, Naming,
  Fehlerbehandlung) werden übernommen statt pro Feature neu erfunden. Bei Unsicherheit:
  bestehenden, ähnlichen Code im Repo als Vorlage nehmen.
- **Deterministisches bleibt deterministisch.** Gemäß Roadmap-Leitplanke: alles, was Makros,
  Kalorien, Diät-Constraints, Lagerbestände oder Supplement-Zeiten betrifft, wird
  regelbasiert/deterministisch berechnet, niemals von einem Sprachmodell generiert. Dieses
  Prinzip ist nicht verhandelbar und gilt unabhängig vom Milestone.
- **Fehlerbehandlung ist explizit.** Kein stilles Verschlucken von Fehlern (leere
  catch-Blöcke). Nutzer-zugewandte Fehlermeldungen sind klar und handlungsorientiert, keine
  rohen Stacktraces im UI.
- **Tests entstehen mit dem Feature, nicht danach.** Jede neue Backend-Logik (insbesondere
  Makro-Berechnung, Slot-Kompatibilität, Auth/Datenisolation) bekommt automatisierte Tests im
  selben Arbeitsschritt, in dem sie entsteht – nicht als nachgelagerter Task.
- **Security & Performance-Gegenprobe** aus der Roadmap wird pro Milestone tatsächlich
  durchgeführt (siehe Roadmap-Abschnitt „Leitplanken"), nicht nur als Formalität abgehakt.

---

## 3. Secrets & öffentliches Repository

Das Repository ist/wird **öffentlich auf GitHub** (`origin`: `https://github.com/AndreasByr/food.git`)
und steht unter der **PolyForm Noncommercial License 1.0.0** (`LICENSE`-Datei im Root) –
öffentlich einsehbar, aber ausdrücklich nicht für kommerzielle Nutzung freigegeben. Daraus
folgt verbindlich:

- Niemals Secrets, API-Keys, DB-Credentials oder personenbezogene Testdaten committen – auch
  nicht in Seed-/Beispiel-Daten, Kommentaren oder Commit-Messages.
- Alle Secrets laufen ausschließlich über Umgebungsvariablen der Coolify-Instanz. Der
  Tauri2-Client darf grundsätzlich keine Backend-Secrets im Bundle enthalten.
- `.gitignore` deckt mindestens ab: `.env*`, native Build-Ordner (`src-tauri/target`,
  `node_modules`), lokale DB-Dumps, IDE-lokale Konfigurationsdateien mit potenziell
  sensiblen Pfaden.
- Dieses Prinzip gilt für **jeden** zukünftigen Milestone, der neue Secrets einführt
  (z.B. Haiku-API-Key ab M5) – kein Sonderfall, keine Ausnahme „nur für den Test".

---

## 4. Git-Branch-Workflow

### 4.1 Branch-Modell

- **`main`** ist der einzige deploybare Branch. Alles, was auf `main` liegt, ist automatisch
  live (siehe Abschnitt 5).
- Für **jeden Milestone** wird zu Beginn ein eigener Branch angelegt, benannt nach dem
  Milestone: `m1`, `m2`, `m3`, … `m7`. Die gesamte aktive Entwicklungsarbeit eines Milestones
  findet ausschließlich auf diesem Branch statt, niemals direkt auf `main`.
- Innerhalb eines Milestone-Branches darf der Agent frei committen (kleine, nachvollziehbare
  Commits statt einem einzelnen Riesen-Commit).

### 4.2 Abschluss eines Milestones (per Quick-Task)

Nach Abschluss der aktiven Entwicklung eines Milestones wird der Merge nach `main` **nicht**
automatisch und **nicht** direkt vom Milestone-Agenten durchgeführt, sondern als eigener,
kleiner **Quick-Task-Prompt**:

1. Der Quick-Task prüft, dass der GitHub-Actions-CI-Workflow (Test-CI, siehe Abschnitt 4.3)
   auf dem Milestone-Branch **erfolgreich grün** durchgelaufen ist. Ist die CI nicht grün,
   wird **nicht** gemerged – stattdessen werden die fehlschlagenden Tests als Ergebnis des
   Quick-Tasks gemeldet und behoben, bevor ein neuer Merge-Versuch gestartet wird.
2. Erst wenn CI grün ist, erstellt der Agent selbst einen **Pull Request** vom Milestone-Branch
   (z.B. `m1`) gegen `main`. Der Agent merged **nicht eigenmächtig durch** – der Pull Request
   ist der Übergabepunkt an den Menschen zur finalen Freigabe/Review.
3. Erst nach Merge des Pull Requests in `main` gilt der Milestone als abgeschlossen im Sinne
   des Git-Workflows. Der Merge nach `main` löst automatisch das Deployment aus (Abschnitt 5).

Dieser Ablauf (Branch → CI grün → PR vom Agenten → menschlicher Merge → Auto-Deploy) ist ab
M1 etabliert und gilt unverändert für M2–M7. Jeder Milestone-Prompt kann sich auf diesen
Abschnitt verweisen, statt den Workflow erneut zu beschreiben.

### 4.3 GitHub Actions – Test-CI

- Ab M1 existiert ein GitHub-Actions-Workflow (z.B. `.github/workflows/test.yml`), der bei
  jedem Push auf einen Milestone-Branch sowie bei jedem Pull Request gegen `main` automatisiert
  Tests ausführt (Backend-Tests mindestens; Frontend-Tests, sobald vorhanden).
- Ein Pull Request gegen `main` darf gemäß Abschnitt 4.2 nur erstellt werden, wenn dieser
  Workflow auf dem Milestone-Branch bereits erfolgreich war. Zusätzlich sollte der Workflow als
  Required-Check für `main` in den GitHub-Branch-Protection-Regeln hinterlegt werden, sobald das
  Repository das zulässt (kann in M1 direkt eingerichtet werden, ansonsten als offener Punkt für
  M1 vermerken).

---

## 5. Deployment

- **Trigger:** Coolify ist über die GitHub-Integration direkt an den `main`-Branch dieses
  Repositories angebunden. Jeder Merge/Push auf `main` löst automatisch ein Deployment aus –
  kein manueller Deploy-Schritt nötig und keiner vorgesehen.
- **Ziel:** Coolify-Instanz und Webserver laufen auf dem Host `myweby` (SSH-erreichbar).
  Backend und die parallele Web/PWA-Version werden dort auf der Subdomain `food.myweby.org`
  ausgeliefert.
- **Reihenfolge:** Milestone-Branch → CI grün → PR → menschlicher Merge in `main` →
  Coolify erkennt den Push auf `main` → Deployment auf `food.myweby.org`. Es gibt **keinen**
  Weg, bei dem ungetesteter oder nicht-reviewter Code automatisch live geht.
- Native Mobile-Builds (iOS/Android, ab M1 eingerichtet) sind von diesem Web-Deployment
  getrennt zu betrachten – sie laufen über die native Tauri-Build-Pipeline, nicht über
  Coolify/`food.myweby.org`.

---

## 6. Geltungsbereich

Abschnitte 2 (Clean Code) und 3 (Secrets) gelten uneingeschränkt für jede Codezeile in jedem
Milestone. Abschnitte 4 und 5 (Branch-/Deploy-Workflow) sind ab M1 aktiv – M1 richtet den
CI-Workflow und die Coolify-GitHub-Anbindung erstmalig ein, alle folgenden Milestones nutzen
das bestehende Setup unverändert weiter, statt es neu zu bauen.
