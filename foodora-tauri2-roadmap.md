# Foodora Reboot – Übergreifende Roadmap (Tauri2, Mobile-First, Multi-User)

> Dieses Dokument ist die milestone-übergreifende Klammer über alle GSD2-Milestone-Prompts.
> GSD2 selbst erzeugt nur pro Milestone eine Roadmap – dieses Dokument hält North Star,
> Architektur, Design-Referenz und Cross-Cutting-Prinzipien fest, damit jeder Milestone-Prompt
> darauf verweisen kann statt Kontext zu wiederholen.

---

## North Star

**Foodora ist die App, die einem sagt, was man heute essen soll, was man am Meal-Prep-Tag
vorkochen muss, und was man wann wo einkaufen soll – ohne dass man selbst etwas planen muss.
Man passt nur an.**

Foodora ist kein starres Vorgabe-System mehr, sondern ein **Baustein-System**: der Nutzer
definiert selbst, wie viele Mahlzeiten er wann will, legt eigene Supplements mit eigenen
Erinnerungen an und bekommt darüber einen KI-Coach, der auf Basis kuratierten
Ernährungswissens Empfehlungen ausspricht – ohne autonom in den Plan einzugreifen.

---

## Leitplanken (gelten für jeden Milestone)

- **Determinismus vor KI-Generierung.** Alles, was falsch sein kann und echten Schaden anrichtet
  (Makros, Kalorien, Diät-Constraints, Lagerbestände, Supplement-Zeiten) wird deterministisch
  berechnet. KI ist ausschließlich Formulierungs-/Ranking-Schicht über bereits validierten,
  regelbasierten Entscheidungen – nie Quelle für Zahlen oder inhaltliche Entscheidungen.
- **Keine manuellen Trigger für Automatisierbares.**
- **Flexibilität statt starrer Rezepte.** Slot-System, bidirektionale Swaps, veganer Constraint
  ist immer hart.
- **Mobile-First, nicht Mobile-Adapted.** Das UI wird zuerst für Mobile entworfen und gebaut;
  Desktop ist die hochskalierte Anpassung des Mobile-Layouts, nicht umgekehrt.
- **Multi-User von Grund auf**, aber Weitergabe an echte Freunde erst, wenn die App aus
  Nutzersicht fertig ist (siehe Abschnitt „Wann geht die App an Freunde raus").
- **Kein Chat-Interface für KI.** KI wird ausschließlich in feste, vordefinierte Prozesse
  eingebettet, an Stellen, wo sie nachweisbar eine sinnvolle Ergänzung ist – nicht, um KI
  eingebaut zu haben.
- **Die Case-Study ist Teil des Produkts**, nicht nachträgliche Doku. Jede bewusste KI-Abwägung
  wird dokumentiert, wenn sie getroffen wird.
- **Security & Performance werden pro Milestone mitgedacht, nicht am Ende auditiert.** Jeder
  Milestone enthält vor der Umsetzung eine kurze Architektur-Gegenprobe („Wo könnte diese
  Entscheidung zu einem Security- oder Performance-Problem werden, und wollen wir das jetzt
  ändern, bevor gebaut wird") sowie einen konkreten Security- und Performance-Optimierungs-Task
  im Scope selbst. Kein nachträglicher „Security-Audit-Milestone" am Schluss, der bestehende
  Architektur wieder umbaut.

---

## Design-Referenz

Visuelle Richtschnur: [Big Cart – Grocery App (Figma Community)](https://www.figma.com/community/file/1180139584868792437/grocery-app-big-cart)
– cleanes, minimalistisches, modernes Grocery-/Food-App-Design, konsequent Mobile-first
(40+ Mobile-Screens, für Android und iOS ausgelegt), kartenbasierte Listen, klare Typografie,
Bottom-Tab-Navigation.

Übertragung auf Foodora:
- Kartenbasierte Darstellung für Rezepte, Produkte und Slots (statt Listen-only)
- Bottom-Tab-Navigation für die 5 Tabs (Heute, Plan, Liste, Lager, Einstellungen) –
  Standard-Pattern für Mobile-Grocery-Apps, direkt übertragbar
- Die Einkaufslisten-UI (M4) kann sich am dortigen Cart-/List-Pattern besonders eng orientieren,
  da es sich um dieselbe Grundfunktion (Warenkorb/Einkaufsliste) handelt
- Klare, reduzierte Farbpalette und großzügige Touch-Targets statt dichter Desktop-Tabellen –
  wichtig, da Desktop das Mobile-Layout nur skaliert, nicht neu erfindet

Dieses Referenzfile dient als **Stimmungsbild**, nicht als 1:1-Vorlage – Foodora ist keine
Grocery-Delivery-App, sondern eine Meal-Planning-App; Struktur- und Layout-Patterns werden
übernommen, Inhalte und Flows bleiben foodora-eigen.

---

## Architektur

- **Backend:** Nuxt4 + Nitro (API-only), PostgreSQL via Drizzle ORM, Session/JWT-Auth mit
  Datenisolation pro Nutzer, Deployment via Coolify.
- **Client:** Tauri2, Frontend als Nuxt4-SPA. **Mobile-first gebaut**, native Build-Targets
  (iOS/Android) werden bereits in M1 eingerichtet, nicht erst später – damit ab dem ersten
  Milestone auf echtem Gerät/Emulator getestet werden kann. Desktop-Layout ist die
  hochskalierte Variante des Mobile-Layouts.
- **Kommunikation:** Client spricht ausschließlich über REST-API mit dem Backend.
- **Datenmodell:** Rezepte als Slot-Strukturen, Makro-Neuberechnung bei jedem Slot-Swap
  (Atwater-Faktoren), nie KI-generierte Zahlen.
- **KI-Layer:** Claude Haiku als reine Formulierungsschicht über einem kuratierten,
  strukturierten Regelwerk (kein RAG/Embedding-Suche nötig – Kontext wird direkt injiziert).
  Haiku trifft keine inhaltlichen Entscheidungen, sondern formuliert nutzerfreundlich, was das
  Regelwerk bereits festgelegt hat. Jeder KI-Aufruf wird protokolliert (Regel → Quelle →
  Formulierung), damit jede Ausgabe nachvollziehbar auf eine konkrete Regel zurückführbar ist.

---

## Wann geht die App an Freunde raus?

Erst wenn die App aus Nutzersicht **fertig** ist – nicht nach einzelnen Milestones. Das
bedeutet: keine Datenschutzerklärung/Einwilligungstexte vor M7 nötig, aber auch kein frühes
iteratives Feedback von echten Dritten während des Baus. Konsequenz: Test- und
Integrationsqualität pro Milestone (siehe unten) muss entsprechend gründlich sein, da kein
externes Feedback als Sicherheitsnetz zwischen den Milestones existiert – die Fehlersuche liegt
vollständig bei dir.

---

## Milestone-Übersicht mit Key Requirements und Testphasen

Bauzeit durch den GSD2-Agenten ist kein Flaschenhals (realistisch 2–3 Milestones/Woche
Agenten-Kapazität) – der eigentliche Zeitfresser ist **Review und Testphase**. Deshalb: pro
Milestone eine eigene, aber unterschiedlich lange Testphase direkt danach, kein gruppiertes
Testen mehrerer Milestones.

### M1 – Fundament + Mobile-First UI-Grundgerüst (Testphase: 1 Woche)
**Ziel:** Backend, Datenmodell, Mobile-First-Client inkl. nativer Build-Targets stehen.

Key Requirements:
- Nuxt4/Nitro-Backend, Postgres-Schema (Drizzle): Users, Ingredients, Recipes (Slot-Struktur),
  Inventory, Shopping-Lists, Supplements – alle nutzerskopiert
- Multi-User-Auth (Register/Login), strikte Datenisolation
- Deterministische Makro-Berechnung (Atwater) als Backend-Service
- Manuelle Rezepterfassung
- **Mobile-first UI-Grundgerüst**, Design-Anlehnung an Big-Cart-Referenz (kartenbasiert,
  Bottom-Tab-Nav, 5 Tabs: Heute, Plan, Liste, Lager, Einstellungen)
- **Native Mobile-Build-Targets (iOS/Android) via Tauri2 bereits eingerichtet**, Desktop-Layout
  als skalierte Variante des Mobile-Layouts
- **Parallel-Deployment als Web/PWA:** dieselbe Nuxt4-SPA-Codebasis wird zusätzlich als normale
  Website (z. B. Coolify-Subdomain) deployt, ergänzt um Web App Manifest + Service Worker
  (`@vite-pwa/nuxt`). Ermöglicht browserbasiertes Testen auf echten Geräten ohne Sideloading/
  Signing während M1–M5 – ersetzt den nativen Tauri-Build nicht, sondern ergänzt ihn als
  schnellerer Test-Kanal, solange noch keine nativen Fähigkeiten (Push-Notifications, native
  Storage/Permissions) gebraucht werden
- Echte Onboarding-Barriere direkt beim Start (aktive Bestätigung, kein reiner Textbaustein) –
  Hinweis, dass die App für Menschen mit Ernährungsproblemen/Essstörungen ungeeignet sein kann
- Case-Study-README wird angelegt (Grundthese: Determinismus vs. KI, Referenz M27)

**Security & Performance – Gegenprobe vor Umsetzung:**
- Auth: Passwort-Hashing (Argon2/bcrypt), Session-/JWT-Ablauf und Refresh-Strategie von Anfang
  an sauber, nicht nachträglich gehärtet
- Datenisolation zwischen Nutzern auf DB-Query-Ebene testen (nicht nur auf UI-Ebene verlassen)
- API-Grundschutz: Rate-Limiting und Input-Validierung von Beginn an im Nitro-Layer, nicht als
  späterer Zusatz
- Performance-Frage vor dem Bauen: Welche DB-Indizes braucht das Schema von Anfang an (User-ID
  als Fremdschlüssel überall, absehbar häufige Queries), damit nicht später migriert werden muss

Testphase 1 Woche, weil hier zum ersten Mal geprüft wird, ob native Mobile-Builds überhaupt
laufen (Grundvoraussetzung für alle folgenden Milestones) – trotz noch fehlender
Workflow-Tiefe.

### M2 – Flexibler Rezept-Wochenplan (Testphase: 1 Woche)
**Ziel:** Erster echter End-to-End-Workflow (Plan generieren, Slots anpassen).

Key Requirements:
- Slot-System (Beilage-Slot, Proteinquelle-Slot etc.) mit Kompatibilitätsregeln
- Veganer Constraint hart, nie durch Swap verletzbar
- Makro-Neuberechnung bei jedem Slot-Swap
- Deterministischer Pool-Selection-Algorithmus für die Plangenerierung
- Bidirektionale Swaps
- Baustein-Logik: Nutzer definiert selbst Anzahl/Zeiten der Mahlzeiten (kein festes
  2-Shakes-1-groß-1-klein-Schema mehr, das war die alte Vorgabe)
- Quickie ≤15 Min als Standard; Prep-Gericht und optional ein Samstagsgericht dürfen länger sein

**Security & Performance – Gegenprobe vor Umsetzung:**
- Pool-Selection-Algorithmus: Komplexität vorab abschätzen (wie viele Slot-Kombinationen
  entstehen bei voller Nutzerfreiheit) – Gefahr von N+1-Queries oder kombinatorischer Explosion
  bei der 4-Wochen-Plangenerierung vorab durchdenken, nicht erst bei spürbarer Verzögerung
  merken
- Autorisierung bei Slot-Swaps: sicherstellen, dass ein Nutzer nur eigene Pläne verändern kann
  (Server-seitige Prüfung, nicht nur Client-seitig verstecktes UI)

### M3 – Smarte Lagerverwaltung (Testphase: 1 Woche)
**Ziel:** Bestandsführung, automatisch mit Plan/Verbrauch mitlaufend.

Key Requirements:
- Bestandsführung pro Nutzer
- Automatischer Abzug bei „gekocht/verbraucht", kein manueller Trigger
- Abweichungserkennung mit automatischer Reaktion statt manueller Meldung
- Schnittstelle für M4

**Security & Performance – Gegenprobe vor Umsetzung:**
- Nebenläufigkeit: was passiert, wenn Lagerbestand gleichzeitig durch „gekocht"-Event und
  manuelle Korrektur verändert wird (Race Condition bei parallelen Writes) – Transaktionsschutz
  vorab einplanen, nicht nachträglich patchen
- Datenvalidierung serverseitig (keine negativen Mengen, keine unplausiblen Einheiten), damit
  fehlerhafte Werte nicht bis in M4 (Einkaufsliste) durchsickern

### M4 – Smarte Einkaufsliste (Testphase: 1 Woche)
**Ziel:** Einkaufsliste von Anfang an gegen Lagerbestand abgeglichen.

Key Requirements:
- Automatische Aggregation aus Wochenplan
- Abgleich mit Lagerbestand aus M3
- Zwei-Listen-System (aktuelle + nächste Woche), Samstag als Einkaufstag-Annahme
- Dual-Source-Zuordnung: Picnic (frisch) / Koro (Trockenware)
- UI orientiert sich eng an der Cart-/Listen-Darstellung der Big-Cart-Referenz

**Security & Performance – Gegenprobe vor Umsetzung:**
- Aggregation über Wochenplan + Lager ist potenziell die teuerste Query der App (Join über
  mehrere Tabellen pro Nutzer) – Indizes und Query-Plan vorab prüfen, nicht erst wenn die Liste
  spürbar langsam lädt
- Zwei-Listen-System: sicherstellen, dass „aktuelle" und „nächste Woche" nicht durch
  fehlerhafte Zeitzonenlogik gegeneinander verrutschen (klassische Off-by-one-Woche-Falle)

### M5 – KI-Coach: Empfehlungen für Rezepte, Produkte & Supplements (Testphase: 1 Woche)
**Ziel:** Der Kern-KI-Case der Case-Study.

Key Requirements:
- Deterministischer Kandidaten-Pool (Präferenzen, Ernährungsform, Historie)
- Nutzer legt eigene Supplements im Plan an, mit frei benannter, generischer
  Zeit-Erinnerung (kein Dosierungs-/Wechselwirkungs-Feature, nicht als
  Medikamenten-Feature kommuniziert – kann dafür genutzt werden, ist aber nicht das
  primäre Ziel)
- KI-Supplement-Hinweise ausschließlich ernährungsform-basiert (z. B. „vegane Ernährung
  macht B12 grundsätzlich relevant"), keine Dosierung, keine Diagnose, Formulierung als
  Hinweis statt Empfehlung
- Claude Haiku als reine Formulierungsschicht über kuratiertem Regelwerk (kein RAG),
  keine autonomen Schlussfolgerungen durch das Modell
- KI macht **keine autonomen Änderungen am Wochenplan** – nur Empfehlungen, die der
  Nutzer selbst übernimmt oder ignoriert
- Audit-Log für jeden KI-Aufruf (Regel → Quelle → Formulierung), damit jede KI-Ausgabe
  nachvollziehbar ist *(Annahme: wird aufgenommen, da geringer Zusatzaufwand und hoher
  Nutzen fürs Case-Study-Argument – bei Bedarf einfach streichen)*
- Ausführlichster Case-Study-Abschnitt entsteht hier

**Security & Performance – Gegenprobe vor Umsetzung:**
- Haiku-API-Calls: Timeout- und Fallback-Verhalten definieren (was zeigt die App, wenn der
  KI-Call fehlschlägt oder langsam ist) – KI-Ausfall darf nie einen Kernworkflow blockieren,
  da KI hier nur Formulierung, nicht Kernlogik ist
- Kein Nutzer-Freitext ungefiltert an Haiku weiterreichen, falls an irgendeiner Stelle doch
  Freitext-Input existiert (Prompt-Injection-Vermeidung), obwohl kein Chat-Interface geplant ist
- Audit-Log nicht ungebremst wachsen lassen (Rotation/Aufbewahrungsfrist von Anfang an
  mitdenken, sonst wird die Log-Tabelle selbst zum Performance-Problem)

### M6 – Mobile-Feinschliff: Notifications, Permissions & Performance (Testphase: 3–4 Tage)
**Ziel:** Da das UI bereits ab M1 mobile-first gebaut und getestet wurde, bleibt hier nur noch
die native Vertiefung übrig – kein Layout-Neubau mehr.

Key Requirements:
- Push-Notifications für Supplement-Erinnerungen (native Permission-Handling iOS/Android) –
  ab hier ist der native Tauri-Build zwingend erforderlich, da Web Push auf iOS (erst ab
  iOS 16.4, stark eingeschränkt) für zuverlässige Supplement-Erinnerungen nicht ausreicht;
  die parallele Web/PWA-Version aus M1 deckt diesen Fall nicht mehr ab
- Storage-/Berechtigungs-Feinschliff
- Performance-Tuning auf echten Geräten (schwächere Hardware, Akkuverhalten)
- Offline-/Reconnect-Verhalten der App bei Netzwerkwechsel

**Security & Performance – Gegenprobe vor Umsetzung:**
- Notification-Payloads dürfen keine sensiblen Klartext-Inhalte enthalten (z. B. Supplement-Name
  in der Push-Vorschau je nach Sensibilität abwägen), da Lockscreen-Benachrichtigungen von
  Dritten einsehbar sein können
- Speicher-/Akku-Profiling auf echtem Gerät, bevor Store-Einreichung – Performance-Probleme
  hier sind der häufigste Grund für schlechte Store-Bewertungen nach Launch

Kürzere Testphase, da überwiegend Konfigurations-/Verifikationsarbeit, keine neue
Layout-Fläche mehr.

### M7 – Store-Readiness (Testphase: 1 Woche)
**Ziel:** App ist einreichbar bei Apple App Store und Google Play.

Key Requirements:
- Datenschutzerklärung, Impressum, Einwilligungstexte (jetzt fällig, da App an Freunde geht)
- Account-Löschung als Pflicht-Feature
- App-Icons, Splash-Screens, Store-Listings
- Signing/Provisioning (Apple Developer Account, Google Play Console)
- Einreichung; Review-Wartezeit liegt außerhalb der aktiven Arbeitszeit

**Security & Performance – Gegenprobe vor Umsetzung:**
- Finale Durchsicht aller bisherigen Security-Gegenproben (M1–M6) als Checkliste – Ziel ist
  Bestätigung, dass nichts offen ist, nicht das erstmalige Aufdecken neuer Probleme an dieser
  Stelle
- Produktions-Secrets/API-Keys (Haiku, DB-Credentials) korrekt über Coolify-Umgebungsvariablen
  verwaltet, nicht im Client-Bundle gelandet (Tauri2-Client darf keine Backend-Secrets enthalten)

Volle Woche eingeplant, da Signing-/Provisioning-Fehler erfahrungsgemäß mehrere Anläufe
brauchen.

---

## Zeitplan-Gesamtübersicht

| Milestone | Thema | Testphase |
|---|---|---|
| M1 | Fundament + Mobile-First UI + native Build-Targets | 1 Woche |
| M2 | Flexibler Rezept-Wochenplan | 1 Woche |
| M3 | Smarte Lagerverwaltung | 1 Woche |
| M4 | Smarte Einkaufsliste | 1 Woche |
| M5 | KI-Coach: Empfehlungen | 1 Woche |
| M6 | Mobile-Feinschliff | 3–4 Tage |
| M7 | Store-Readiness | 1 Woche |

**Gesamtlaufzeit:** ca. 8–9 Wochen (Bauzeit durch Agenten + Testphasen), sofern Reviewzeit
der tatsächliche Flaschenhals bleibt und keine gravierenden Integrationsprobleme zwischen
den Milestones auftreten.

---

## Case-Study-README – Führung über alle Milestones

1. **In M1 angelegt:** Grundthese „Determinismus für Korrektheit, KI für
   Formulierung/Empfehlung", Referenz auf M27 (unzuverlässige KI-Makros: 160g Protein bei
   319 kcal).
2. **Bei jedem Milestone ergänzt:** jede bewusste KI-Abwägung wird im Moment der Entscheidung
   dokumentiert.
3. **In M5 am ausführlichsten:** KI-Coach-Empfehlungen (Rezepte, Produkte, Supplements) sind
   der Ort, an dem die KI-Abwägung am sichtbarsten wird – inklusive der bewussten Entscheidung,
   Supplement-Hinweise auf Ernährungsform statt Dosierung zu beschränken, und der
   Audit-Log-Nachvollziehbarkeit als konkreter Gegenbeweis zum „Blackbox-KI"-Vorwurf.
4. **Format:** Problem → Architekturentscheidung → KI-Einsatz (was, warum, was nicht) →
   Ergebnis, pro Milestone ein kurzer Abschnitt.

---

## Referenzierung in GSD2-Milestone-Prompts

Jeder Milestone-Prompt (M1–M7) referenziert dieses Dokument statt North Star, Architektur,
Design-Referenz und Leitplanken jedes Mal zu wiederholen. Slicing-Entscheidungen innerhalb
eines Milestones bleiben beim Agenten.
