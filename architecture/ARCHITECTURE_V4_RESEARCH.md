# Architecture v4 — Research-backed engineering decisions
**Status:** target architecture and implementation boundaries. No claim of full production readiness.

## Executive decision
Use a **local-first, evidence-first modular monolith** with a framework-neutral semantic scene graph, versioned asset/document formats, and plugin registries. Start with one deployable web app plus optional API/storage service. Introduce separate services only when operational measurements justify them. Do not make AI, Three.js, React, or a vendor database the source of truth.

## Research and design trade-offs (reviewed November 2026)

| Candidate / source | Fit for our spatial presentation product | Decision |
|---|---|---|
| Three.js + GLTFLoader, official docs | glTF/GLB interoperable meshes, materials, cameras and animations | **Adopt** as first spatial runtime; never interpret primitive shapes as source-accurate physical models |
| React Three Fiber, pmndrs | Componentized 3D, on-demand rendering, shared asset loaders, instancing | **Adopt in UI migration**; keep semantic core framework-neutral; use stable React/R3F matching major versions |
| React Three Fiber v10 alpha / WebGPU | Potential future backend, API churn | **Defer**; do not base core on alpha |
| MediaPipe Tasks Vision | 21-point landmarks, local camera inference, documented synchronous detectForVideo | **Adopt as optional input adapter**; worker boundary and backpressure, never own presenter state |
| XState v5 actors | Explicit mode transitions, interruption and tracking-loss recovery | **Adopt for orchestration**, not as document database |
| Zustand | Small editable UI state and selectors | **Adopt for UI state only**, not canonical evidence or sync protocol |
| Yjs | CRDT document collaboration and offline merging | **Optional later**; avoid premature collaborative complexity; adapters preserve future capability |
| tldraw architecture | Typed records, schema migrations, reversible diffs and scoped presence are useful patterns | **Study patterns, do not copy product code wholesale**; licensing and compatibility review first |
| PDF.js | Page-level extraction and worker support | **Adopt** PDF adapter with source locators; scanned docs must be marked incomplete |
| Apache ECharts | Source datasets and transformations, accessible 2D charts | **Adopt for dense analytics**, keep 3D for spatial insight |
| ELK.js | Explicit directed graphs and layout constraints | **Adopt for process diagrams** with evidence-backed edges |
| Khronos glTF 2.0 | Open portable 3D asset specification | **Canonical imported model format**; version assets by hash |
| WebXR | Real spatial anchoring possible only on supported hardware | **Optional future adapter**; webcam desktop is not AR |

Sources: https://threejs.org/manual/pages/loading-3d-models.html ; https://threejs.org/docs/pages/GLTFLoader ; https://r3f.docs.pmnd.rs/advanced/scaling-performance ; https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js ; https://stately.ai/docs/actor-model ; https://zustand.docs.pmnd.rs/reference/middlewares/persist ; https://docs.yjs.dev/ .

## Core dependency direction
```
apps/web (dashboard, content studio, editor, presenter)
  -> application/use-cases (import, compile, edit, present, export)
  -> domain (SourceDocument, Evidence, Dataset, SemanticScene, Asset, Project)
  -> ports (Parser, EvidenceVerifier, SceneCompiler, AssetRepository, ProjectRepository, InputAdapter)
adapters/pdf, pptx, docx, sheets, ai, storage, mediapipe
  -> ports and domain
renderers/three, html, echarts
  -> validated RenderPlan only
```
No domain import from UI, camera, storage, renderer or network. No renderer import from parser. A package dependency check in CI must enforce this.

## Why the old design is inadequate
The current `studio.js` directly orchestrates DOM, Three.js, parser, scene state, localStorage and MediaPipe. The existing document adapter flattens PDF pages and other structures to plain text, discarding crucial locators. The current scene compiler guesses CSV shape from commas and only supports a few types. These are acceptable alpha shortcuts, **not** the final architecture.

Do not replace the alpha entrypoint until the new pipeline has parity tests and can migrate existing saved projects. The new `architecture/scene-registry.js` and `architecture/command-bus.js` are first independent modules, not proof of migration.

## Data and provenance requirements
1. Store original document bytes and SHA-256 hash (if user consents to persistence), with immutable revision IDs.
2. Preserve page, slide, paragraph, sheet/cell, and model node identifiers in normalized blocks.
3. Every derived metric stores source IDs, formula AST, unit, precision and evaluation date.
4. Every graph edge stores source references, direction, type, and review status.
5. Never convert prose to numeric axes, currencies, timestamps or physical measurements without explicit source evidence.
6. Human edits invalidate or supersede source verification; keep revision history.
7. AI proposes structured candidates. The deterministic validator rejects unknown evidence, fabricated units, unsafe asset URLs, and unsupported geometry.

## Scene runtime contract
The scene registry binds **scene type -> validator -> semantic compiler -> layout engine -> renderer -> DOM fallback -> export adapter**. Dynamic plugins must declare capability and API version; reject unsupported versions. The runtime accepts a typed RenderPlan, not raw HTML, model-generated JS or document content. Third-party model assets are treated as untrusted input.

The 3D runtime manages a single authoritative scene state and multiple views. Renderer resources are pooled; asset loading is abortable, bounded and observable. Camera fit derives from bounding boxes and safe-area constraints. Text stays in accessible DOM overlays where practical; text-only 3D sprites are fallback, not the core typography system. No arbitrary connection loops.

## Gesture input contract
Webcam capture (consent) -> frame sampling -> MediaPipe worker (where supported) -> landmark smoothing -> classification -> gesture statechart -> command bus -> presenter actor -> render state. Gesture commands require dwell and cooldown; lost tracking cancels active manipulation. Point, Pinch, Hold, Grab, Two-hand Spread, Fist-Hold are distinct state-machine actions. Mouse and keyboard emit identical commands. Never require the camera to operate the product. No voice.

## Persistence and collaboration
Local-first authoring with IndexedDB and exportable project package. Cloud adapter uses authenticated APIs, Postgres for metadata/revisions and private object storage for assets. Use optimistic concurrency and immutable revisions; do not use browser localStorage for large files. Consider Yjs only when actual simultaneous editing becomes a product requirement. Separate ephemeral presence from durable content.

## Security and governance
No arbitrary eval of model outputs or untrusted scripts. Content Security Policy, dependency pinning, SRI where relevant, package/license inventory, security scanning, max file sizes, decompression-bomb protections, SVG/HTML sanitization, model URI allowlist and quotas. Camera frames never persist or transmit without explicit consent. Source citations visible during authoring and inspectable during presentation.

## Performance budgets and fallbacks
Design budgets (to be measured, not asserted): 60 FPS target on mainstream desktop for ordinary scenes; graceful 30 FPS on weaker devices; capped GPU memory and draw calls; no main-thread synchronous inference in production; render on demand when idle. Use progressive loading, instancing, LOD, abortable jobs, resource disposal, WebGL context restoration and HTML fallback. Dense 50+ data rows belong in HTML/ECharts, not hundreds of tiny 3D labels.

## Extensibility tests required
- Register a tenth scene type without touching core scene validation or the editor.
- Swap Three.js renderer for a headless HTML fallback without changing the project file.
- Feed identical commands from gesture/keyboard and assert identical presenter state.
- Reject unsupported graph edges, currencies and 3D geometry claims.
- Import v1 alpha JSON through explicit versioned migration with no silent data loss.
- Import real PDF/PPTX/XLSX fixtures and inspect source locators.
- Load GLB with nested meshes and animations; preserve hierarchy and asset provenance.
- Test missing network, denied camera, WebGL loss, malformed documents, huge models and interrupted imports.

## Decisions explicitly deferred
- No microservices or Kubernetes.
- No WebGPU-only architecture or experimental alpha dependency.
- No mandatory real-time collaboration or CRDT.
- No promise that arbitrary text generates a physically accurate 3D object.
- No copying internet code without checking license, dependencies, security and API compatibility.

## Roadmap gates
A. Domain contracts + source-locator fixtures + migration; B. scene registry and deterministic layout compiler; C. real glTF asset pipeline and stable Three.js runtime; D. command bus and gesture actor; E. persistence/versioning; F. optional AI/collaboration. Each gate includes evidence-backed contract tests and a compatibility matrix.

**Best architecture means best fit under constraints, not maximal dependency count.** The core must remain stable as visual and AI technologies evolve.
