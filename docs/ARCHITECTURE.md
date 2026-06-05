# ◈ HERMES AGENT INTEGRATION — ARHITECTURĂ v3.0

### Fișă Tehnică Completă — Reconstruită după NousResearch/hermes-agent

> Această arhitectură fuzionează principiile din proiectul original Hermes Agent (Python)
> cu implementarea TypeScript/React existentă, menținând compatibilitatea cu formatul proiectului.

---

## STRUCTURA PROIECTULUI (Hermes Agent Pattern)

```
src/
├── services/
│   ├── agent/
│   │   ├── AgentEngine.ts          # Orchestrator principal (10-Layer Pipeline)
│   │   ├── AgentPlanner.ts         # Planificare taskuri (LLM-driven)
│   │   ├── AgentPerception.ts      # Analiză perție Layer 3
│   │   ├── AgentRouter.ts          # Routing + Tool State Machine
│   │   ├── SemanticRouter.ts       # Clasificare semantică ONNX
│   │   ├── SystemContext.ts        # Asamblare prompt (Hermes prompt_builder)
│   │   ├── SkillRegistry.ts        # Registru skilluri cu SKILL.md resolution
│   │   ├── SkillUtils.ts           # Frontmatter, parsing, plugin dispatch
│   │   ├── ToolRegistry.ts         # Registru tooluri cu toolset support
│   │   ├── TrajectoryTracker.ts    # Urmărire execuție + learning loop
│   │   ├── ErrorClassifier.ts      # Clasificare erori + recovery
│   │   ├── ContextCompressor.ts    # Compresie inteligentă context
│   │   ├── PromptCacher.ts         # Cache LRU + snapshot persistent
│   │   ├── CredentialPool.ts       # Pool credențiale + rotation
│   │   ├── localHeuristics.ts      # Utilități heuristice
│   │   └── tools/
│   │       ├── coreTools.ts        # Tooluri de bază (8+)
│   │       └── ToolRegistry.ts     # Registru tooluri (enhanced)
│   ├── memory/
│   │   ├── MemoryManager.ts        # Multi-provider memory orchestration
│   │   ├── MemoryProvider.ts       # Abstract provider interface
│   │   └── db.ts                   # Dexie IndexedDB schema
│   ├── integration/
│   │   ├── ConnectorManager.ts     # Manager conectori externi
│   │   ├── SkillManager.ts         # Manager skilluri integrare
│   │   ├── init.ts                 # Inițializare conectori + skilluri
│   │   ├── connectors/
│   │   │   ├── githubConnector.ts
│   │   │   ├── googleConnector.ts
│   │   │   └── vercelConnector.ts
│   │   └── skills/
│   │       ├── githubSkills.ts
│   │       ├── googleSkills.ts
│   │       └── vercelSkills.ts
│   └── hermes/
│       ├── hermesApiClient.ts      # Client HTTP pentru backend Hermes
│       └── hermesWebSocketClient.ts # Client WebSocket streaming
├── types/
│   ├── hermes.ts                   # Tipuri Hermes Agent (comprehensive)
│   ├── agent.ts                    # Tipuri pipeline agent
│   ├── memory.ts                   # Tipuri memorie
│   ├── integration.ts             # Tipuri integrare
│   └── index.ts                    # Tipuri generale
├── store/
│   ├── agentStore.ts              # Zustand store pentru agent
│   └── integrationStore.ts        # Zustand store pentru integrări
└── components/
    └── agent/
        └── AgentControlView.tsx    # UI Control Panel
```

---

## SISTEME GLOBALE (transversale — active pe tot parcursul execuției)

| Sistem | Sursă Hermes | Descriere |
| --- | --- | --- |
| **COST GUARD** | run_agent.py | Maxim tokens, tool calls și iterații per request. Monitorizat continuu. Warning la iter. 8. |
| **CONFIDENCE SYSTEM** | AgentEngine | Scor `high / medium / low` generat per răspuns, afișat în UI. |
| **TRAJECTORY TRACKER** | agent/trajectory.py | Înregistrează fiecare pas de execuție pentru learning și debugging. |
| **ERROR CLASSIFIER** | agent/error_classifier.py | Clasifică erori în 7 niveluri de severitate cu strategii de recovery. |
| **LEARNING LOOP** | AgentEngine + SkillRegistry | Auto-creare skilluri din patternuri de execuție reușite. |
| **CREDENTIAL POOL** | agent/credential_pool.py | Pool de credențiale cu rotation round-robin și rate-limit tracking. |
| **PROMPT CACHE** | agent/prompt_caching.py | Cache LRU (8 entries) + snapshot IndexedDB pentru system prompt. |

---

## ORDINEA EXECUȚIEI

```
REQUEST PRIMIT
      ↓
[1]  SYSTEM CONTEXT     → SOUL.md + identity + platform hints + skills index + context files (prompt_builder)
      ↓
[2]  MEMORY LOAD        → prefetch all providers (episodic + semantic + procedural + RAG) + working memory
      ↓
[3]  PERCEPTION         → intent + situation + goals + events  ← TIMESTAMP INTRĂ AICI
      ↓
[4]  ROUTING            → complexity → mod operare; tool state machine; skill injection (conditional visibility)
      ↓
[5]  THINKING           → Chat Mode (5 pași) sau Agent Mode (7 pași + TODO List)
      ↓
[6]  PRE-TOOL SAFETY    → write guard + sensitive data filter + injection scan (context files)
      ↓
[7]  TOOLS              → READ liber / WRITE cu confirmare; externalizare >60k tokens cu compaction
      ↓
[8]  POST-TOOL SAFETY   → recursion limit + QC + self-correction loop + frustration detector + error classification
      ↓
[9]  RESPONSE           → format + confidence + proactive + citations + plan leakage prevention
      ↓
[10] LEARNING           → SYNC: critical memory │ ASYNC: episode + procedural + trajectory + skill creation
           ↕
     UI SYSTEM          → sistem separat, subscrie la events, nu blochează execuția
```

---

## NOU COMPONENTE HERMES (adaugate din GitHub)

### Multi-Provider Memory (agent/memory_manager.py)

MemoryManager suportă acum patternul **fail-tolerant fan-out**:
- **Provider Built-in:** Dexie/IndexedDB (mereu activ)
- **Provider Extern:** Max 1 plugin provider (ex: agentmemory, custom backend)
- **Tool Routing:** MemoryManager.route_tool_call() direcționează tool calls către provider-ul corect
- **Lifecycle Hooks:** on_turn_start, on_session_end, on_pre_compress, on_memory_write, on_delegation
- **Snapshot Persistence:** Prefetch context wrapped in `<memory-context>` fence tags

### Skill System (agent/skill_utils.py + tools/skills_tool.py)

Sistem complet de skilluri cu rezoluție în 5 faze:
1. **Plugin Dispatch:** Nume calificate (namespace:skill_name)
2. **Direct Path:** Potrivire directă pe nume
3. **Name Scan:** Căutare case-insensitive
4. **Legacy Flat Scan:** Cătere în structura veche
5. **Fuzzy Match:** Potrivire parțială

Caracteristici:
- **Frontmatter Parsing:** YAML cu name, description, category, platforms, conditions, prerequisites
- **Setup Requirements:** Variabile de mediu, credential collection
- **Conditional Visibility:** requires/fallbackFor pentru tooluri
- **Auto-Skill Creation:** Learning loop creează skilluri din patternuri reușite
- **Categories:** coding, research, finance, writing, data_analysis, devops, creative, etc.

### Trajectory Tracker (agent/trajectory.py)

Urmărește fiecare pas de execuție:
- Input, intent, tool calls, LLM usage, tokens, outcome, duration, corrections
- **Pattern Detection:** Identifică secvențe recurente de tool calls (≥3 occurrences, ≥70% success rate)
- **Skill Effectiveness:** EMA (alpha=0.3) pentru fiecare skill auto-creat

### Error Classifier (agent/error_classifier.py)

7 niveluri de severitate cu recovery automat:
| Severitate | Retry | Delay | Exemplu |
| --- | --- | --- | --- |
| transient | Da | 3s | Network error |
| retryable | Da | 5s | 502/503 |
| rate_limit | Da | 5s | 429 |
| timeout | Da | 2s | Tool timeout |
| auth | Nu | - | Invalid API key |
| context_overflow | Nu | - | Token limit |
| permanent | Nu | - | CORS |

### Context Compressor (agent/context_compressor.py)

- **LLM Compression:** Summarizare inteligentă pentru rezultate >60k chars
- **Head/Tail Truncation:** Fallback (70% head, 20% tail) când LLM eșuează
- **History Compression:** Ultimele 8 mesaje intacte, restul sumarizat
- **Token Estimation:** Ajustat pentru CJK (1 token ≈ 2 chars CJK, 4 chars engleză)

### Prompt Cacher (agent/prompt_caching.py)

- **Layer 1 (LRU):** Map cu max 8 entries, eviction LRU
- **Layer 2 (Snapshot):** IndexedDB cu version validation
- **Cache Keys:** Identity + platform + tools + toolsets + context files hash
- **Context File Hash:** Detectă modificări pentru invalidare

### Credential Pool (agent/credential_pool.py + credential_sources.py)

- **Round-Robin Rotation:** Distribuie echilibrat între credențiale
- **Rate-Limit Tracking:** Cooldown automat (default 60s)
- **Multi-Source:** env, file, OAuth, static
- **Provider Support:** Gemini, OpenAI, OpenRouter, Anthropic, etc.

### Tool Registry (tools/registry.py) — Enhanced

Pattern de înregistrare Hermes cu metadata extinsă:
- `toolset`: Grupare logică (core, skills, memory, browser, integration)
- `checkFn()`: Funcție de disponibilitate
- `emoji`: Display emoji pentru UI
- `requires`: Capabilități necesare
- `fallbackFor`: Activează doar când toolurile principale nu sunt disponibile
- `priority`: Prioritate de execuție
- `isWrite`: Marchează tooluri ce necesită confirmare

---

## DEPENDENȚE CRUCE (Cross-Component Dependencies)

```
AIAgent (AgentEngine)
  ├── SystemContext ← prompt_builder pattern (SOUL.md, context files, skills, platform hints)
  │     └── PromptCacher (LRU + snapshot)
  ├── MemoryManager ← memory_manager pattern (multi-provider, fail-tolerant)
  │     └── MemoryProvider (abstract interface)
  │     └── sanitizeContext, buildMemoryContextBlock
  ├── SkillRegistry ← skill_utils + skills_tool pattern
  │     └── SkillUtils (frontmatter, parsing, plugin dispatch)
  ├── ToolRegistry ← registry pattern (toolset, checkFn, emoji)
  ├── TrajectoryTracker ← trajectory pattern (step recording, pattern detection)
  ├── ErrorClassifier ← error_classifier pattern
  ├── ContextCompressor ← context_compressor pattern
  ├── CredentialPool ← credential_pool pattern
  ├── AgentRouter ← routing + tool state machine
  ├── AgentPerception ← perception analysis
  └── AgentPlanner ← LLM-driven planning
```

---

## COMPARAȚIE CU HERMES AGENT (Python → TypeScript)

| Componentă Hermes (Python) | Echivalent TypeScript | Status |
| --- | --- | --- |
| agent/prompt_builder.py | SystemContext.ts + PromptCacher.ts | ✅ Implementat |
| agent/memory_manager.py | MemoryManager.ts (class-based) | ✅ Implementat |
| agent/memory_provider.py | MemoryProvider.ts (abstract) | ✅ Implementat |
| tools/registry.py | ToolRegistry.ts (enhanced) | ✅ Implementat |
| agent/skill_utils.py | SkillUtils.ts | ✅ Implementat |
| tools/skills_tool.py | SkillRegistry.ts (enhanced) | ✅ Implementat |
| agent/trajectory.py | TrajectoryTracker.ts | ✅ Implementat |
| agent/error_classifier.py | ErrorClassifier.ts | ✅ Implementat |
| agent/context_compressor.py | ContextCompressor.ts | ✅ Implementat |
| agent/prompt_caching.py | PromptCacher.ts | ✅ Implementat |
| agent/credential_pool.py | CredentialPool.ts | ✅ Implementat |
| agent/credential_sources.py | (inclus în CredentialPool.ts) | ✅ Implementat |
| run_agent.py (AIAgent) | AgentEngine.ts (10-layer) | ✅ Există, adaptat |
| tools/memory_tool.py | (via MemoryManager) | ✅ Via providers |
| tools/delegate_tool.py | (via TrajectoryTracker) | ✅ Partial |
| agent/context_engine.py | (în AgentEngine.ts) | ✅ Integrat |
| tools/skill_manager_tool.py | SkillRegistry.ts | ✅ Integrat |
| tools/terminal_tool.py | coreTools.ts (workspace) | ✅ Există |
| tools/web_tools.py | coreTools.ts (perform_search) | ✅ Există |
| skills/ (directories) | integration/skills/ | ✅ Există |
| hermes_state.py | agentStore.ts | ✅ Există |
