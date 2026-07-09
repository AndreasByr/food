# Foodora – Design System

> Verbindliches Referenzdokument für alle Milestones (M1–M7). Jede UI-Entscheidung
> (Farbe, Schrift, Abstand) leitet sich aus diesem Dokument ab – keine Hardcoded-Werte,
> die davon abweichen. Änderungen an diesem Dokument gelten für alle folgenden
> Milestones, nicht nur rückwirkend für den, in dem sie entstehen.
>
> Basis: die 5 verbindlichen Markenfarben (Black, Prussian Blue, Sea Green,
> Alabaster Grey, White) aus der Roadmap. Alle weiteren Farb-Tokens in diesem
> Dokument sind **abgeleitete Tints/Shades/Opazitäten dieser 5 Farben** – es werden
> keine neuen, unabhängigen Markenfarben eingeführt, mit Ausnahme der klar markierten
> semantischen Zustandsfarben (Error/Warning), die für Formvalidierung etc. nötig sind.

---

## 1. Farbsystem (Colors)

### 1.1 Basis-Palette (Roh-Werte)

| Name | Hex | Verwendung (roh) |
|---|---|---|
| Black | `#000000` | Tiefste Fläche/Text im Dark Mode |
| Prussian Blue | `#14213D` | Primärfarbe, Marken-Ton |
| Sea Green | `#3E885B` | Akzent-/Erfolgsfarbe |
| Alabaster Grey | `#E5E5E5` | Neutrale Fläche/Trennlinien |
| White | `#FFFFFF` | Tiefste Fläche/Text im Light Mode |

### 1.2 Abgeleitete Tint-/Shade-Skala

Jede Basisfarbe bekommt eine 10-stufige Skala (50–900), erzeugt durch Mischung mit
Weiß (Tints, helle Stufen) bzw. Schwarz (Shades, dunkle Stufen). Notation:
`{farbe}-{stufe}`. Die Zwischenwerte darf GSD2 per Standard-HSL-Lightness-Interpolation
generieren (kein manuelles Pixel-Picking nötig) – Referenzwerte für die wichtigsten
Stufen:

**Prussian Blue Skala**
| Token | Hex (ca.) | Verwendung |
|---|---|---|
| `prussian-50` | `#EEF0F4` | Dezenter Hintergrund (Light Mode, z.B. Info-Banner) |
| `prussian-100` | `#D2D7E3` | Deaktivierte Flächen, Skeleton-Loader |
| `prussian-300` | `#8894AF` | Placeholder-Text, deaktivierter Text |
| `prussian-500` | `#3D4C71` | Sekundäre Buttons, Icons |
| `prussian-700` | `#1C2A4A` | Primärfarbe angehoben (Hover-Zustand von primary) |
| `prussian-900` (=Basis) | `#14213D` | **Primärfarbe (primary)** |

**Sea Green Skala**
| Token | Hex (ca.) | Verwendung |
|---|---|---|
| `seagreen-50` | `#EAF4EE` | Success-Hintergrund, Badge-Flächen |
| `seagreen-100` | `#CDE6D6` | Aktive/Selected-Zustände (dezent) |
| `seagreen-300` | `#84BC98` | Sekundäre Akzente |
| `seagreen-500` (=Basis) | `#3E885B` | **Akzentfarbe (accent) / Success** |
| `seagreen-700` | `#2C6742` | Hover/Pressed-Zustand von accent |

**Neutral-Skala (zwischen White und Black, Alabaster als Fixpunkt)**
| Token | Hex | Verwendung |
|---|---|---|
| `neutral-0` | `#FFFFFF` | White |
| `neutral-50` | `#F7F7F7` | Light-Mode Hintergrund (App-Background) |
| `neutral-100` | `#E5E5E5` | Alabaster Grey – Light-Mode Surface/Card, Trennlinien |
| `neutral-200` | `#CFCFCF` | Border, Divider (Light Mode) |
| `neutral-400` | `#9A9A9A` | Sekundärer Text (Light Mode) |
| `neutral-600` | `#5C5C5C` | Icons inaktiv |
| `neutral-800` | `#1E1E1E` | Dark-Mode Surface (angehoben) |
| `neutral-900` | `#121212` | Dark-Mode Hintergrund (App-Background), nahe Black |
| `neutral-1000` | `#000000` | Black – reinster Dark-Mode-Ton, sparsam einsetzen |

### 1.3 Semantische Tokens – Light Mode

| Token | Wert | Zweck |
|---|---|---|
| `color-background` | `neutral-50` (`#F7F7F7`) | App-Hintergrund |
| `color-surface` | `neutral-0` (`#FFFFFF`) | Karten, Sheets, Bottom-Nav |
| `color-surface-alt` | `neutral-100` (`#E5E5E5`) | Sekundäre Flächen, Chips, Input-Felder |
| `color-primary` | `prussian-900` (`#14213D`) | Primäre Buttons, aktive Tab-Icons, Headlines |
| `color-primary-hover` | `prussian-700` (`#1C2A4A`) | Pressed/Hover-Zustand von primary |
| `color-accent` | `seagreen-500` (`#3E885B`) | CTAs mit positiver Konnotation, Erfolgs-Badges, aktiver Fortschritt |
| `color-accent-hover` | `seagreen-700` (`#2C6742`) | Pressed/Hover-Zustand von accent |
| `color-text-primary` | `neutral-1000` (`#000000`) | Fließtext, Headlines |
| `color-text-secondary` | `neutral-400` (`#9A9A9A`) | Captions, Metadaten, Platzhalter |
| `color-text-on-primary` | `neutral-0` (`#FFFFFF`) | Text/Icons auf `color-primary`-Flächen |
| `color-border` | `neutral-200` (`#CFCFCF`) | Trennlinien, Card-Outlines |
| `color-icon-inactive` | `neutral-600` (`#5C5C5C`) | Inaktive Bottom-Tab-Icons |

### 1.4 Semantische Tokens – Dark Mode

| Token | Wert | Zweck |
|---|---|---|
| `color-background` | `neutral-900` (`#121212`) | App-Hintergrund |
| `color-surface` | `neutral-800` (`#1E1E1E`) | Karten, Sheets, Bottom-Nav |
| `color-surface-alt` | `prussian-900` (`#14213D`) | Sekundäre Flächen, Chips, Input-Felder – Prussian Blue trägt hier die Markenpräsenz |
| `color-primary` | `neutral-0` (`#FFFFFF`) | Primäre Buttons/Text invertiert sich gegen den dunklen Hintergrund |
| `color-primary-hover` | `neutral-100` (`#E5E5E5`) | Pressed/Hover-Zustand von primary |
| `color-accent` | `seagreen-500` (`#3E885B`) | Bleibt identisch zu Light Mode – Wiedererkennung über beide Modi |
| `color-accent-hover` | `seagreen-300` (`#84BC98`) | Pressed/Hover-Zustand von accent (im Dark Mode aufgehellt statt abgedunkelt) |
| `color-text-primary` | `neutral-0` (`#FFFFFF`) | Fließtext, Headlines |
| `color-text-secondary` | `neutral-400` (`#9A9A9A`) | Captions, Metadaten, Platzhalter |
| `color-text-on-primary` | `neutral-1000` (`#000000`) | Text/Icons auf `color-primary`-Flächen |
| `color-border` | `prussian-700` (`#1C2A4A`) | Trennlinien, Card-Outlines |
| `color-icon-inactive` | `neutral-400` (`#9A9A9A`) | Inaktive Bottom-Tab-Icons |

### 1.5 Semantische Zustandsfarben (Success/Warning/Error)

Nicht Teil der 5 Basisfarben, aber für Formvalidierung, Lagerbestand-Warnungen (M3)
und Einkaufslisten-Status (M4) notwendig. Bewusst zurückhaltend gewählt, damit sie
nicht mit der Markenpalette konkurrieren – bei Bedarf in einem späteren Milestone
anpassbar.

| Token | Light Mode | Dark Mode | Zweck |
|---|---|---|---|
| `color-success` | `seagreen-500` (`#3E885B`) | `seagreen-500` (`#3E885B`) | Erfolgsmeldungen (deckt sich mit `color-accent`, keine neue Farbe nötig) |
| `color-warning` | `#B8860B` (Dark Goldenrod) | `#D4A017` | Lagerbestand niedrig, Ablaufdatum nah (M3) |
| `color-error` | `#B3261E` | `#E46962` | Formfehler, fehlgeschlagene Requests |

### 1.6 Nutzungsregeln

- `color-accent` (Sea Green) ist reserviert für **positive/bestätigende** Aktionen
  (Rezept speichern, Slot-Swap bestätigen, „gekocht"-Häkchen) – nicht für generische
  Primär-Buttons verwenden, sonst verliert er seine Signalwirkung.
- `color-primary` ist die Standardfarbe für Struktur (Headlines, aktive
  Navigation, primäre Buttons ohne besondere Konnotation).
- Alabaster Grey wird im Light Mode nie als Fließtext-Hintergrund direkt hinter
  Body-Text verwendet (Kontrast), sondern nur für Flächen/Chips/Trennlinien.
- Kontrast-Mindestwert: alle Text-auf-Fläche-Kombinationen aus 1.3/1.4 müssen
  WCAG AA (4.5:1 für Fließtext, 3:1 für große Headlines) erfüllen – bei Anpassung
  einzelner Tint-Stufen ist das vor Übernahme zu prüfen.

---

## 2. Typografie (Typography)

### 2.1 Schriftarten

| Rolle | Font | Fallback-Stack | Einsatz |
|---|---|---|---|
| Display/Headline | **Inter** (Weight 600–800) | `-apple-system, "Segoe UI", Roboto, sans-serif` | Screen-Titel, Rezeptnamen, große Zahlen (Makros) |
| Body/UI | **Inter** (Weight 400–500) | wie oben | Fließtext, Buttons, Labels, Listen |
| Mono/Daten | **JetBrains Mono** | `"SF Mono", Consolas, monospace` | Nur für exakte Zahlenwerte, die nicht „springen" dürfen (z.B. Timer im Cook-Mode, Mengen in der Einkaufsliste) |

Begründung: Eine einzige Grundschrift (Inter) über Display und Body hält die App
ruhig und lesbar auf kleinen Mobile-Screens – Gewichts- statt Familienwechsel für
Hierarchie, passend zum cleanen/minimalistischen Big-Cart-Stimmungsbild. Die
Mono-Schrift verhindert Layout-Jitter bei sich ändernden Zahlen (z.B. Live-Timer).

Inter und JetBrains Mono sind beide Open-Source (SIL Open Font License), lizenzkostenfrei
für ein öffentliches GitHub-Repo einsetzbar.

### 2.2 Type Scale

Skalierung auf Basis 16px, Verhältnis ≈ 1.25 (Major Third, leicht abgerundet auf
das 4px-Raster aus Abschnitt 3). Zeilenhöhe als Vielfaches von 4px.

| Token | Größe | Line-Height | Weight | Einsatz |
|---|---|---|---|---|
| `text-display` | 32px | 40px | 700 | Große Screen-Header (z.B. „Heute") |
| `text-h1` | 28px | 36px | 700 | Screen-Titel |
| `text-h2` | 24px | 32px | 600 | Card-/Sektionstitel |
| `text-h3` | 20px | 28px | 600 | Sub-Sektionen, Modal-Titel |
| `text-body-lg` | 18px | 28px | 400 | Hervorgehobener Fließtext (z.B. Rezeptbeschreibung) |
| `text-body` | 16px | 24px | 400 | Standard-Fließtext, Formularfelder |
| `text-body-sm` | 14px | 20px | 400 | Sekundärtext, Listen-Metadaten |
| `text-caption` | 12px | 16px | 500 | Labels, Tags, Bottom-Nav-Beschriftung |
| `text-overline` | 11px | 16px | 600 (Letter-Spacing +0.04em, Uppercase) | Kategorie-Eyebrows (z.B. „PROTEINQUELLE") |
| `text-data-lg` | 24px | 28px | 600 (Mono) | Große Makro-/Timer-Zahlen |
| `text-data-sm` | 14px | 20px | 500 (Mono) | Kleine Mengenangaben (Einkaufsliste) |

### 2.3 Regeln

- Minimale Lesbarkeitsgröße auf Mobile: `text-body-sm` (14px) – kleiner nur für
  reine Icon-Begleit-Labels (`text-caption`), nie für Inhalte, die aktiv gelesen
  werden müssen.
- Zeilenhöhe folgt immer dem 4px-Raster (siehe Abschnitt 3), auch bei zukünftigen
  neuen Type-Tokens.
- Fließtextblöcke (`text-body`, `text-body-lg`) maximal ~65 Zeichen pro Zeile auf
  breiteren Layouts (Desktop-Skalierung) – auf Mobile durch Spaltenbreite ohnehin
  begrenzt.

---

## 3. Abstände und Layout (Layout & Spacing)

### 3.1 Spacing-System – striktes 4px-Raster

Alle Abstände (Padding, Margin, Gap) sind ausschließlich Vielfache von 4px. Keine
Ad-hoc-Werte wie `10px` oder `15px`.

| Token | Wert | Typischer Einsatz |
|---|---|---|
| `space-1` | 4px | Icon-zu-Label-Abstand, Mikro-Trennung |
| `space-2` | 8px | Innerhalb von Komponenten (z.B. Chip-Padding vertikal) |
| `space-3` | 12px | Kompaktes Card-Padding, Abstand zwischen verwandten Elementen |
| `space-4` | 16px | **Standard-Padding** (Card-Innenabstand, Screen-Rand-Padding Mobile) |
| `space-5` | 20px | Abstand zwischen Card und nächstem Block |
| `space-6` | 24px | Abstand zwischen Sektionen innerhalb eines Screens |
| `space-8` | 32px | Große Sektionsabstände, Abstand vor/nach Bottom-Tab-Bar-Inhalt |
| `space-10` | 40px | Screen-Top-Padding unterhalb der Status-/Header-Bar |
| `space-12` | 48px | Trennung großer Blöcke (z.B. zwischen Wochentagen im Plan) |
| `space-16` | 64px | Leerzustände (Empty States), großzügiger vertikaler Ausgleich |

### 3.2 Touch-Targets

- Minimale Touch-Target-Größe: **44×44px** (Apple HIG / Material Design Minimum),
  unabhängig vom sichtbaren Icon/Text – bei Bedarf per unsichtbarem Padding auf
  44px aufgefüllt.
- Abstand zwischen zwei nebeneinanderliegenden Touch-Targets: mindestens `space-2`
  (8px), um Fehltaps zu vermeiden.

### 3.3 Grid & Breakpoints

Mobile-first: das Layout wird für die kleinste Breite entworfen, größere
Breakpoints skalieren das bestehende Layout, statt ein neues zu erfinden
(siehe Leitplanke „Mobile-First, nicht Mobile-Adapted" in der Roadmap).

| Breakpoint-Token | Breite | Spalten | Rand-Padding (`margin`) | Gutter |
|---|---|---|---|---|
| `bp-mobile` | 0–599px | 4 Spalten | `space-4` (16px) | `space-4` (16px) |
| `bp-tablet` | 600–959px | 8 Spalten | `space-6` (24px) | `space-4` (16px) |
| `bp-desktop` | ≥ 960px | 12 Spalten | `space-8` (32px), max. Content-Breite 1200px zentriert | `space-6` (24px) |

- Auf Mobile (`bp-mobile`) spannen Karten in Listen standardmäßig die volle
  Grid-Breite (4/4 Spalten); Produkt-/Rezept-Karten in horizontal scrollbaren
  Reihen (z.B. „Empfehlungen") dürfen 2–2.5 Spalten breit sein, um das nächste
  Element anzuteasern.
- Auf Desktop (`bp-desktop`) werden Karten-Listen zu Mehrspalten-Grids
  (z.B. 3–4 Karten pro Reihe), nie zu dichten Tabellen – Kartenmetapher bleibt
  über alle Breakpoints erhalten.

### 3.4 Radius & Elevation

| Token | Wert | Einsatz |
|---|---|---|
| `radius-sm` | 8px | Chips, Tags, kleine Buttons |
| `radius-md` | 12px | Standard-Card-Radius (Rezept-/Produktkarten) |
| `radius-lg` | 20px | Bottom-Sheets, Modals |
| `radius-full` | 999px | Avatar, runde Icon-Buttons, Pill-Badges |

| Token | Light Mode Shadow | Dark Mode | Einsatz |
|---|---|---|---|
| `elevation-1` | `0 1px 2px rgba(0,0,0,0.06)` | kein Shadow, stattdessen `color-surface` +1 Stufe heller als Background | Karten im Ruhezustand |
| `elevation-2` | `0 4px 12px rgba(0,0,0,0.10)` | Border `1px solid color-border` statt Shadow | Bottom-Nav, Sticky-Header, Modals |

Hinweis Dark Mode: Schatten wirken auf dunklem Grund kaum sichtbar – Elevation wird
dort primär durch Flächenhelligkeit (`color-surface` vs. `color-background`) und
optional eine dezente Border gelöst, nicht durch Shadow-Opazität.

### 3.5 Bottom-Tab-Navigation (konkrete Maße)

- Höhe: 64px (+ Safe-Area-Inset auf iOS) – Vielfaches von `space-16`
- Icon-Größe: 24px, Label darunter in `text-caption` (12px), Abstand Icon→Label:
  `space-1` (4px)
- Aktiver Tab: Icon + Label in `color-primary` (bzw. `color-accent`, falls ein
  bewusst hervorgehobener Tab gewünscht ist – Standard ist `color-primary`),
  inaktive Tabs in `color-icon-inactive`

---

## 4. Anwendung in M1 und darüber hinaus

- Alle Tokens aus diesem Dokument werden als CSS-Variablen bzw. Design-Tokens im
  Frontend zentral definiert (z.B. `assets/tokens.css` oder Nuxt-Runtime-Config),
  nicht als verstreute Hex-/Pixel-Literale in einzelnen Komponenten.
- Light/Dark-Mode-Umschaltung greift auf die Tokens aus 1.3/1.4 zurück; Komponenten
  referenzieren ausschließlich die semantischen Namen (`color-surface` etc.), nie
  direkt `#14213D` o.ä. – so bleibt ein zukünftiger Palette-Wechsel an einer
  einzigen Stelle steuerbar.
- Dieses Dokument wird bei Bedarf erweitert (z.B. Icon-Set-Konventionen,
  Motion-/Animation-Tokens in M6), aber nicht rückwirkend so verändert, dass
  bereits gebaute Screens brechen – Erweiterungen sind additiv.
