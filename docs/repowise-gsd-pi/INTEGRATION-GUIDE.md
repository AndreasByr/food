# Repowise + GSD-Pi Integration Guide

> Vollständige Anleitung zur Integration von [repowise](https://github.com/repowise-dev/repowise)
> (Codebase Intelligence MCP Server) mit [GSD-Pi](https://github.com/anthropics/gsd-pi)
> (AI Coding Agent). Basiert auf den Erfahrungen aus dem Foodora-Projekt (Juli 2026).

---

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Voraussetzungen](#voraussetzungen)
3. [Schritt-für-Schritt Einrichtung](#schritt-für-schritt-einrichtung)
4. [GSD-Pi MCP-Architektur verstehen](#gsd-pi-mcp-architektur-verstehen)
5. [repowise MCP-Tools](#repowise-mcp-tools)
6. [System-Prompt-Injektion](#system-prompt-injektion)
7. [Ollama Cloud als LLM-Provider](#ollama-cloud-als-llm-provider)
8. [Figma MCP hinzufügen](#figma-mcp-hinzufügen)
9. [Troubleshooting](#troubleshooting)
10. [Lessons Learned](#lessons-learned)
11. [Checkliste für neue Projekte](#checkliste-für-neue-projekte)

---

## Überblick

### Was ist repowise?

repowise ist ein Codebase-Intelligence-Tool, das ein Repository in fünf Schichten
indexiert und über MCP-Tools (Model Context Protocol) abfragbar macht:

| Schicht | Beschreibung |
|---------|-------------|
| **Graph** | Tree-sitter Dependency-Graph (15 Sprachen), Call-Resolution, PageRank, Community-Detection |
| **Git** | Hotspots (Churn x Complexity), Ownership, Co-Change-Paare, Bus Factor |
| **Docs** | LLM-generiertes Wiki pro Datei/Modul, inkrementell bei jedem Commit |
| **Decisions** | Architektonische Decisions aus 8 Quellen, mit Evidence und Supersedes-Graph |
| **Code Health** | 25 deterministische Marker, Defect Risk 1-10, Refactoring-Pläne (Zero LLM, <30s) |

### Was ist GSD-Pi?

GSD-Pi ist ein AI-Coding-Agent (ähnlich Claude Code), der MCP-Server als Werkzeuge
nutzt. Im Gegensatz zu Claude Code **injiziert GSD-Pi mit Ollama-Provider MCP-Tools
nicht automatisch** in den System-Prompt — der Agent muss sie über Bridge-Tools
explizit aufrufen.

### Warum beide zusammen?

- repowise liefert strukturierte Codebase-Intelligenz (Graph, Git, Health, Dead Code)
- GSD-Pi kann diese über MCP nutzen, wenn der Agent weiß, wie er sie aufrufen muss
- Das bedeutet: weniger `grep`/`glob` für Architektur-Fragen, bessere Antworten über
  "warum existiert dieser Code" (Decisions + Git-History), Risiko-Scoring vor Änderungen

---

## Voraussetzungen

### System

- Python 3.11+ (für repowise)
- Node.js 20+ (für Figma MCP, optional)
- Git
- Ein LLM-Provider (Ollama Cloud, Anthropic, OpenAI, oder Gemini)

### pip installieren (falls fehlend)

```bash
# Falls pip nicht vorhanden:
curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
python3 /tmp/get-pip.py --break-system-packages
```

### repowise installieren

```bash
# Mit OpenAI-Support (für Ollama Cloud via OpenAI-compatible API):
python3 -m pip install "repowise[openai]" --break-system-packages

# Verifikation:
repowise --version
# -> repowise, version 0.31.0
```

---

## Schritt-für-Schritt Einrichtung

### Schritt 1: repowise installieren

```bash
python3 -m pip install "repowise[openai]" --break-system-packages
repowise --version
```

### Schritt 2: API-Keys als Env-Vars setzen

**Wichtig:** API-Keys niemals in committbare Dateien schreiben. Nur als
Umgebungsvariablen oder in gitignored Config-Dateien.

```bash
# Ollama Cloud (OpenAI-compatible Endpoint)
export OPENAI_API_KEY="<dein-ollama-cloud-api-key>"
export OPENAI_BASE_URL="https://ollama.com/v1"

# Figma (optional)
export FIGMA_API_KEY="<dein-figma-personal-access-token>"
```

### Schritt 3: Provider-Test (Wegwerf-Verzeichnis)

**Wichtig:** Teste zuerst in einem Wegwerf-Repo, bevor du das echte Projekt
indexierst. So stellst du sicher, dass `OPENAI_BASE_URL` respektiert wird und
die Requests wirklich an Ollama gehen (nicht an api.openai.com).

```bash
# Test mit Fake-Key: Fehler muss von Ollama kommen, nicht von OpenAI
OPENAI_API_KEY="sk-test-fake" OPENAI_BASE_URL="https://ollama.com/v1" \
  repowise init --provider openai -y --test-run
# Erwartet: "Error: Provider validation failed: 401 - Unauthorized"
# Das bestätigt: Requests gehen an ollama.com, nicht an api.openai.com

# Test mit echtem Key:
OPENAI_API_KEY="<dein-key>" OPENAI_BASE_URL="https://ollama.com/v1" \
  repowise init --provider openai --model minimax-m2.7:cloud -y --test-run
# Erwartet: Wiki-Seiten werden generiert
```

### Schritt 4: AGENTS.md sichern (falls vorhanden)

```bash
mkdir -p .gsd/tmp/
cp AGENTS.md .gsd/tmp/AGENTS.md.pre-repowise
```

### Schritt 5: repowise init im Projekt

```bash
OPENAI_API_KEY="<dein-key>" OPENAI_BASE_URL="https://ollama.com/v1" \
  repowise init --provider openai --model minimax-m2.7:cloud -y
```

**Ergebnis:**
- `.repowise/` — lokaler Index (Graph, Git, Wiki, Health, Dead Code)
- `.claude/CLAUDE.md` — Codebase-Intelligence-Anweisungen für Claude Code
- `.mcp.json` — MCP-Server-Config (wird von repowise automatisch angelegt)
- `~/.claude/settings.json` — Claude Code MCP-Registrierung (global)

**Wichtig:** repowise überschreibt **nicht** die bestehende `AGENTS.md`. Es generiert
stattdessen eine separate `.claude/CLAUDE.md`. Kein Merge nötig.

### Schritt 6: .gitignore ergänzen

`.repowise/` muss in `.gitignore` stehen (lokaler Index, Caches, Jobs):

```gitignore
# repowise (local index, caches, jobs)
.repowise/
```

### Schritt 7: MCP-Config für GSD-Pi anlegen

GSD-Pi liest MCP-Server aus drei Quellen (in dieser Reihenfolge, erste gewinnt
bei Duplikaten):

1. `<project>/.mcp.json` — project-shared
2. `<project>/.gsd/mcp.json` — project-local
3. `~/.gsd/mcp.json` — global

**Empfehlung:** Sowohl `.gsd/mcp.json` (Projekt) als auch `~/.gsd/mcp.json`
(Global) anlegen, da GSD-Pi die `.gsd/mcp.json` am zuverlässigsten liest.

**`.gsd/mcp.json` (Projekt-lokal):**

```json
{
  "mcpServers": {
    "repowise": {
      "command": "repowise",
      "args": ["mcp", ".", "--tools", "lean"],
      "env": {
        "OPENAI_API_KEY": "<dein-ollama-cloud-api-key>",
        "OPENAI_BASE_URL": "https://ollama.com/v1"
      }
    }
  }
}
```

**`~/.gsd/mcp.json` (Global, mit absolutem Pfad):**

```json
{
  "mcpServers": {
    "repowise": {
      "command": "repowise",
      "args": ["mcp", "/pfad/zum/projekt", "--tools", "lean"],
      "env": {
        "OPENAI_API_KEY": "<dein-ollama-cloud-api-key>",
        "OPENAI_BASE_URL": "https://ollama.com/v1"
      }
    }
  }
}
```

**Hinweis:** `--tools lean` reduziert auf 5 Tools (statt 10), was den Kontextverbrauch
des LLM senkt. Siehe [repowise MCP-Tools](#repowise-mcp-tools) für Details.

### Schritt 8: System-Prompt-Injektion konfigurieren

**Das ist der wichtigste Schritt!** GSD-Pi mit Ollama-Provider injiziert MCP-Tools
**nicht** automatisch in den System-Prompt. Der Agent muss über die Bridge-Tools
`mcp_servers`, `mcp_discover`, `mcp_call` informiert werden.

#### `.gsd/CONTEXT.md` ergänzen

`.gsd/CONTEXT.md` wird von GSD-Pi in den System-Prompt injiziert. Füge einen
Abschnitt hinzu, der dem Agent erklärt, wie er repowise nutzt:

```markdown
## MCP Tools — repowise

This project has the **repowise** MCP server configured for codebase intelligence.
GSD-Pi with Ollama provider does NOT auto-inject MCP tool schemas — use bridge tools.

### How to use repowise

1. `mcp_servers` — lists configured MCP servers
2. `mcp_discover(server="repowise")` — lists all available repowise tools
3. `mcp_call(server="repowise", tool="<tool_name>", args={...})` — calls a tool

### Available repowise tools

| Tool | Use for |
|------|---------|
| `get_overview` | Architecture summary |
| `get_context` | File/symbol context, dependencies, callers |
| `get_answer` | Natural-language Q&A about codebase |
| `get_symbol` | Symbol definition, references, relationships |
| `search_codebase` | Semantic/lexical search |

### When to use repowise vs grep/glob

- **repowise**: architecture questions, "why does X work this way", dependency
  analysis, dead code, code health, risk scoring
- **grep/glob**: exhaustive literal sweeps, exact string matching, simple lookups
```

#### `.gsd/KNOWLEDGE.md` ergänzen

`.gsd/KNOWLEDGE.md` wird als Regel-Block in den System-Prompt injiziert:

```markdown
| # | Scope | Rule | Why | Added |
|---|-------|------|-----|-------|
| 2 | mcp | Nutze repowise MCP-Tools (via mcp_discover/mcp_call mit server="repowise") für Codebase-Exploration. Für exhaustive Literal-Sweeps bleibt grep/glob besser. | repowise liefert strukturierte Codebase-Intelligenz, die zuverlässiger ist als ad-hoc grep. GSD-Pi mit Ollama injiziert MCP-Tools nicht automatisch. | 2026-07-15 |
```

### Schritt 9: Verifikation

GSD-Pi neu starten, dann:

```
/gsd mcp
```

Erwartet: Beide Server (repowise, figma) werden aufgelistet.

```
/gsd mcp check repowise
```

Erwartet: Status "connected" oder "probe available" mit Tool-Anzahl.

```
/gsd mcp discover repowise
```

Erwartet: Liste aller verfügbaren repowise-Tools.

---

## GSD-Pi MCP-Architektur verstehen

### Zwei-Layer-Architektur

GSD-Pi hat eine **Zwei-Layer-MCP-Architektur**:

#### Layer 1: GSD-Pi's eigene MCP-Client-Erweiterung (immer aktiv)

Datei: `~/.gsd/agent/extensions/mcp-client/index.js`

Diese Erweiterung registriert **drei Bridge-Tools**, die immer verfügbar sind:

| Bridge-Tool | Beschreibung |
|-------------|-------------|
| `mcp_servers` | Listet alle konfigurierten MCP-Server |
| `mcp_discover` | Verbindet sich mit einem Server und listet seine Tools |
| `mcp_call` | Ruft ein spezifisches Tool auf einem Server auf |

**Config-Discovery** (`manager.js`):
```js
getMcpConfigSources() returns:
  1. {project}/.mcp.json          (project-shared)
  2. {project}/.gsd/mcp.json      (project-local)
  3. ~/.gsd/mcp.json              (global)
```

#### Layer 2: Host-Level MCP Auto-Injection (nur Claude Code)

Datei: `~/.gsd/agent/extensions/claude-code-cli/stream-adapter.js`

Wenn GSD-Pi mit dem **Claude Code Provider** läuft, werden MCP-Server-Tools
als `mcp__<server>__<tool>` direkt in den System-Prompt injiziert. Der Agent
kann sie direkt aufrufen, ohne den Bridge-Tool-Umweg.

**Kritisch:** Mit **Ollama-Provider** ist Layer 2 **nicht aktiv**. Der Agent muss
Layer 1's `mcp_servers`/`mcp_discover`/`mcp_call` verwenden.

### Config-Quellen im Detail

GSD-Pi liest MCP-Configs aus drei Quellen (Reihenfolge: erste gewinnt bei Duplikaten):

| Quelle | Pfad | Gitignored? | Zuverlässigkeit |
|--------|------|-------------|-----------------|
| Project shared | `.mcp.json` | evtl. (GSD baseline) | mittel |
| Project local | `.gsd/mcp.json` | ja (via `.gsd/`) | hoch |
| Global | `~/.gsd/mcp.json` | nein (außerhalb Repo) | hoch (unabhängig von cwd) |

**Empfehlung:** Beide anlegen (`.gsd/mcp.json` + `~/.gsd/mcp.json`), um
CWD-abhängige Probleme zu vermeiden.

### Welche Dateien injiziert GSD-Pi in den System-Prompt?

| Datei | Injiziert? | Zweck |
|-------|-----------|-------|
| `.gsd/CONTEXT.md` | **Ja** | Stack, Projekt-Files, CI/CD, Test-Commands, MCP-Anweisungen |
| `.gsd/PROJECT.md` | **Ja** | Projektbeschreibung, Architektur, Patterns |
| `.gsd/CODEBASE.md` | **Ja** | Auto-generierter File-Tree |
| `.gsd/KNOWLEDGE.md` | **Ja** | Projekt-spezifische Regeln, Patterns, Lessons |
| `AGENTS.md` (Root) | **Nein** | Projekt-eigene Agent-Anweisungen (für Claude Code, nicht GSD-Pi) |
| `.claude/CLAUDE.md` | **Nein** | Von repowise generiert, nur für Claude Code |

**Wichtig:** Die `AGENTS.md` im Projekt-Root wird von GSD-Pi **nicht gelesen**.
Sie ist für Claude Code gedacht. Für GSD-Pi-spezifische Anweisungen nutze
`.gsd/CONTEXT.md` oder `.gsd/KNOWLEDGE.md`.

---

## repowise MCP-Tools

### Full Profile (10 Tools, default)

| Tool | Parameter | Beschreibung |
|------|-----------|-------------|
| `get_overview` | — | High-level Architektur-Overview des Codebases |
| `get_answer` | `question`, `file_paths?` | Natural-language Q&A über Codebase (Wiki + LLM) |
| `get_context` | `file_path`, `include?` | File/Symbol-Context: Dependencies, Callers, Health |
| `get_symbol` | `symbol`, `file_path?` | Symbol-Definition, References, Relationships |
| `search_codebase` | `query`, `mode?` | Semantic/Lexical Search über Wiki |
| `get_risk` | `commit_or_range` | Defect-Risk-Score für Commit oder Diff-Range |
| `get_why` | `file_path` oder `symbol` | Warum existiert Code — Git-History, Decisions |
| `get_dead_code` | — | Dead/Unused Code Detection |
| `get_health` | `file_path?` | Code Health Scores (Complexity, Duplication, Cohesion) |
| `list_repos` | — | Listet verfügbare Repositories |

### Lean Profile (5 Tools)

Reduziert Tool-Schema-Overhead für LLMs mit begrenztem Kontextfenster.

| Tool | Beschreibung |
|------|-------------|
| `get_answer` | Natural-language Q&A |
| `get_context` | File/Symbol-Context |
| `get_symbol` | Symbol-Lookup |
| `search_codebase` | Semantic Search |
| `get_risk` | Risk-Scoring |

**Aktivierung:** `--tools lean` in den MCP-Server-Args.

### Aufruf über GSD-Pi Bridge-Tools

```
# Server listen:
mcp_servers()

# Tools entdecken:
mcp_discover(server="repowise")

# Tool aufrufen:
mcp_call(server="repowise", tool="get_overview", args={})
mcp_call(server="repowise", tool="get_context", args={"file_path": "server/api/auth.ts"})
mcp_call(server="repowise", tool="get_answer", args={"question": "How does authentication work?"})
mcp_call(server="repowise", tool="search_codebase", args={"query": "macro calculation"})
mcp_call(server="repowise", tool="get_risk", args={"commit_or_range": "main..HEAD"})
```

---

## System-Prompt-Injektion

### Problem

GSD-Pi mit Ollama-Provider injiziert MCP-Tool-Schemas **nicht** automatisch in den
System-Prompt. Ohne explizite Anweisung weiß der Agent nicht, dass repowise
existiert oder wie er es nutzt.

### Lösung

Zwei Dateien ergänzen, die GSD-Pi in den System-Prompt injiziert:

1. **`.gsd/CONTEXT.md`** — Detaillierte MCP-Tool-Anweisungen (welche Tools, wie aufrufen, wann nutzen)
2. **`.gsd/KNOWLEDGE.md`** — Regel-Eintrag, der den Agent an repowise erinnert

### System-Prompt-Assembly-Reihenfolge

GSD-Pi baut den System-Prompt aus diesen Blöcken (in dieser Reihenfolge):

1. Base system prompt template
2. `[SYSTEM CONTEXT — GSD]` — GSD-Workflow-Anweisungen
3. Preferences block (aus `PREFERENCES.md`)
4. `[KNOWLEDGE — Rules from KNOWLEDGE.md]` — aus `~/.gsd/agent/KNOWLEDGE.md` und `.gsd/KNOWLEDGE.md`
5. `[PROJECT CODEBASE — ...]` — aus `.gsd/CODEBASE.md`
6. `[PROJECT CONTEXT]` — aus `.gsd/CONTEXT.md`
7. `[WORKTREE CONTEXT — ...]` — falls in einem Worktree
8. Subagent model hint
9. `[MEMORY — ...]` — dynamischer per-turn Memory-Block

---

## Ollama Cloud als LLM-Provider

### URL-Korrektur

**Falsch:** `https://api.ollama.com/v1`
**Richtig:** `https://ollama.com/v1`

Der `/api`-Präfix ist bei Ollama für die native Ollama-API (z.B. `/api/chat`)
reserviert, nicht für die OpenAI-kompatible Schicht. Die liegt direkt unter der
Hauptdomain.

### Modellnamen mit `:cloud`-Suffix

Für Cloud-Inferenz muss das Modell mit `:cloud`-Suffix angegeben werden:

```
minimax-m2.7:cloud    # Cloud-Inferenz
glm-5.2:cloud         # Cloud-Inferenz
kimi-k2.6:cloud       # Cloud-Inferenz
```

Ein normaler Modellname ohne `:cloud`-Suffix läuft lokal (falls überhaupt möglich),
nicht in der Cloud.

### Provider-Validierung

repowise validiert den Provider beim `init`-Aufruf. Test mit Fake-Key:

```bash
OPENAI_API_KEY="sk-obviously-fake" OPENAI_BASE_URL="https://ollama.com/v1" \
  repowise init --provider openai -y --test-run
```

Erwartet: `Error: Provider validation failed: 401 - Unauthorized`
Das bestätigt: Requests gehen an ollama.com, nicht an api.openai.com.

### Embedder-Konfiguration

Der Embedder läuft separat vom LLM-Provider. Konfiguriert in `.repowise/config.yaml`:

```yaml
provider: openai
model: minimax-m2.7:cloud
embedder: openai
reasoning: auto
```

Der `openai`-Embedder benötigt `OPENAI_API_KEY` und `OPENAI_BASE_URL`. Ohne diese
Env-Vars läuft der Embedder auf `mock` (keine semantische Suche).

**Fix:** `OPENAI_API_KEY` und `OPENAI_BASE_URL` im `env`-Feld des repowise
MCP-Server-Eintrags in `.gsd/mcp.json` setzen.

### GSD-Pi Child-Env-Allowlist

GSD-Pi gibt an MCP-Server-Child-Prozesse nur eine **eingeschränkte Menge** an
Env-Vars weiter (Allowlist in `manager.js`):

```js
const CHILD_ENV_ALLOWLIST = new Set([
    "PATH", "Path", "HOME", "USER", "USERNAME", "USERPROFILE",
    "SHELL", "TMPDIR", "TEMP", "TMP", "SystemRoot", "WINDIR",
    "APPDATA", "LOCALAPPDATA", "XDG_CONFIG_HOME", "XDG_CACHE_HOME",
]);
```

**`OPENAI_API_KEY` und `OPENAI_BASE_URL` sind NICHT in der Allowlist!** Das bedeutet:
Auch wenn sie in der Shell gesetzt sind, werden sie **nicht** an den repowise
MCP-Server weitergegeben. **Lösung:** Im `env`-Feld des MCP-Config-Eintrags setzen:

```json
{
  "repowise": {
    "command": "repowise",
    "args": ["mcp", ".", "--tools", "lean"],
    "env": {
      "OPENAI_API_KEY": "<key>",
      "OPENAI_BASE_URL": "https://ollama.com/v1"
    }
  }
}
```

Das `env`-Feld wird von GSD-Pi beim Starten des Child-Prozesses gesetzt und
umgeht die Allowlist.

---

## Figma MCP hinzufügen

### Framelink MCP for Figma

Das Standard-Tool ist [Framelink MCP for Figma](https://github.com/GLips/Figma-Context-MCP)
(`figma-developer-mcp` via npx).

### Figma Personal Access Token

Erstellen unter: Figma > Settings > Personal Access Tokens
https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens

### Config-Eintrag

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "<dein-figma-token>"
      }
    }
  }
}
```

### Nutzung in GSD-Pi

```
mcp_discover(server="figma")
mcp_call(server="figma", tool="download_figma_images", args={"fileKey": "...", "nodeIds": ["..."]})
```

---

## Troubleshooting

### "Unknown MCP server: repowise"

**Ursache:** GSD-Pi findet die MCP-Config-Datei nicht.

**Lösung:**
1. Prüfen, dass `.gsd/mcp.json` existiert und valides JSON enthält
2. Prüfen, dass `~/.gsd/mcp.json` existiert (Global, als Fallback)
3. GSD-Pi neu starten (Cache wird geleert)
4. `/gsd mcp` ausführen — sollte Server auflisten

### "No MCP servers configured"

**Ursache:** Weder `.mcp.json` noch `.gsd/mcp.json` noch `~/.gsd/mcp.json` existieren
oder enthalten keinen `mcpServers`-Schlüssel.

**Lösung:** Alle drei Dateien anlegen (siehe [Schritt 7](#schritt-7-mcp-config-für-gsd-pi-anlegen)).

### Embedder läuft auf `mock` (keine semantische Suche)

**Ursache:** `OPENAI_API_KEY` und `OPENAI_BASE_URL` werden nicht an den
repowise MCP-Server-Child-Prozess weitergegeben (GSD-Pi Child-Env-Allowlist
schließt diese Vars aus).

**Lösung:** Env-Vars im `env`-Feld des MCP-Config-Eintrags setzen (siehe
[Ollama Cloud als LLM-Provider](#ollama-cloud-als-llm-provider)).

### repowise AGENTS.md überschreibt meine eigene

**Beobachtung:** repowise generiert `.claude/CLAUDE.md`, nicht `AGENTS.md`.
Die bestehende `AGENTS.md` bleibt unangetastet. Kein Merge nötig.

### `OPENAI_BASE_URL` wird nicht respektiert

**Test:** Fake-Key setzen und schauen, ob die 401-Fehlermeldung von Ollama oder
von OpenAI kommt:

```bash
OPENAI_API_KEY="sk-fake" OPENAI_BASE_URL="https://ollama.com/v1" \
  repowise init --provider openai -y --test-run
```

Kommt `401 - Unauthorized` → Requests gehen an Ollama (korrekt).
Kommt eine andere Fehlermeldung → Requests gehen an api.openai.com (Bug).

**Fallback:** LiteLLM als Proxy verwenden (`repowise[litellm]`), der `api_base`
explizit respektiert.

### `pip` nicht gefunden

```bash
curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
python3 /tmp/get-pip.py --break-system-packages
python3 -m pip install "repowise[openai]" --break-system-packages
```

---

## Lessons Learned

### 1. GSD-Pi liest AGENTS.md nicht

Die `AGENTS.md` im Projekt-Root ist für Claude Code, nicht für GSD-Pi. GSD-Pi liest
`.gsd/CONTEXT.md`, `.gsd/KNOWLEDGE.md`, `.gsd/PROJECT.md` und `.gsd/CODEBASE.md`.
Für GSD-Pi-spezifische Anweisungen müssen diese Dateien genutzt werden.

### 2. MCP-Tools werden mit Ollama nicht auto-injiziert

GSD-Pi hat eine Zwei-Layer-MCP-Architektur. Layer 2 (Auto-Injection) funktioniert nur
mit dem Claude Code Provider. Mit Ollama muss der Agent die Bridge-Tools
(`mcp_servers`/`mcp_discover`/`mcp_call`) explizit nutzen. Ohne Anweisung in
`.gsd/CONTEXT.md` weiß der Agent nicht, dass repowise existiert.

### 3. Child-Env-Allowlist blockiert API-Keys

GSD-Pi gibt nur eine eingeschränkte Menge an Env-Vars an MCP-Server-Child-Prozesse
weiter. `OPENAI_API_KEY` und `OPENAI_BASE_URL` sind nicht in der Allowlist. Lösung:
Im `env`-Feld des MCP-Config-Eintrags setzen.

### 4. `.mcp.json` ist gitignored (GSD baseline)

Die GSD-baseline `.gitignore` enthält `.mcp.json`. Das bedeutet: auch wenn repowise
eine `.mcp.json` im Projekt-Root anlegt, wird sie nicht committet. Das ist für
GSD-Pi nicht relevant (liest aus Working Tree), aber für frische Clones fehlt die
Datei. Lösung: `.gsd/mcp.json` zusätzlich anlegen (ist ebenfalls gitignored, aber
GSD-Pi liest sie aus dem Working Tree).

### 5. Ollama Cloud URL ist `https://ollama.com/v1`, nicht `https://api.ollama.com/v1`

Der `/api`-Präfix ist für die native Ollama-API reserviert. Die OpenAI-kompatible
Schicht liegt direkt unter der Hauptdomain.

### 6. Modellnamen brauchen `:cloud`-Suffix

`minimax-m2.7:cloud` für Cloud-Inferenz, `minimax-m2.7` für lokale Inferenz.
Ohne `:cloud`-Suffix läuft das Modell lokal (falls überhaupt möglich).

### 7. Provider-Test im Wegwerf-Verzeichnis zuerst

Vor dem echten `repowise init` im Projekt: Test im Wegwerf-Verzeichnis mit Fake-Key.
So stellst du sicher, dass `OPENAI_BASE_URL` respektiert wird, bevor du Zeit und
Token in den echten Init investierst.

### 8. `--tools lean` reduziert Kontextverbrauch

Für Ollama-Modelle mit begrenztem Kontextfenster: `--tools lean` (5 Tools statt 10)
senkt den Tool-Schema-Overhead im System-Prompt.

### 9. `.repowise/config.yaml` enthält keine Secrets

Die Config-Datei enthält nur `provider`, `model`, `embedder`, `reasoning`. Keine
API-Keys. Trotzdem sollte `.repowise/` in `.gitignore` stehen (lokaler Index,
Caches, Jobs).

### 10. repowise generiert `.claude/CLAUDE.md`, nicht `AGENTS.md`

repowise überschreibt nicht die bestehende `AGENTS.md`. Es generiert eine separate
`.claude/CLAUDE.md` für Claude Code. GSD-Pi liest diese Datei nicht — für GSD-Pi
müssen die Anweisungen in `.gsd/CONTEXT.md` stehen.

---

## Checkliste für neue Projekte

- [ ] Python 3.11+ installiert
- [ ] pip installiert (`python3 -m pip --version`)
- [ ] `repowise[openai]` installiert (`repowise --version`)
- [ ] Ollama Cloud API-Key besorgt
- [ ] Figma Personal Access Token besorgt (optional)
- [ ] Provider-Test im Wegwerf-Verzeichnis durchgeführt (Fake-Key → 401 von Ollama)
- [ ] Provider-Test mit echtem Key erfolgreich (Wiki-Seiten generiert)
- [ ] `repowise init` im Projekt ausgeführt
- [ ] `.gitignore` um `.repowise/` ergänzt
- [ ] `.gsd/mcp.json` angelegt (mit `env`-Feld für API-Keys)
- [ ] `~/.gsd/mcp.json` angelegt (Global, mit absolutem Pfad)
- [ ] `.gsd/CONTEXT.md` um MCP-Tool-Anweisungen ergänzt
- [ ] `.gsd/KNOWLEDGE.md` um repowise-Regel ergänzt
- [ ] GSD-Pi neu gestartet
- [ ] `/gsd mcp` zeigt repowise (und figma) als konfiguriert
- [ ] `/gsd mcp discover repowise` listet Tools auf
- [ ] `mcp_call(server="repowise", tool="get_overview", args={})` funktioniert