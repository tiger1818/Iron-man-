# Leadership technical review — November 2026

**Review status:** inspected source files and current public documentation; architecture-only review. Browser screenshots, CI results, model loading and end-to-end runtime **not verified**.

## Product north star
A universal evidence-grounded spatial storytelling system that transforms source documents and verified 3D assets into editable, cinematic, presenter-first interactive scenes, with hand gestures optional. Not a medical visualization product, a trading terminal, or a static holographic dashboard.

## Executive verdict
Architecture direction is sound but **not yet a cohesive product**. A series of independent modules is not equivalent to a working system. Stop adding disconnected features. Establish one vertical slice and integrate it end to end. The source of truth is the evidence-backed semantic scene; the renderer is a replaceable consumer. Preserve the existing alpha until parity is proven.

## Source audit: actual gaps
| Severity | Finding | Decision and acceptance criterion |
|---|---|---|
| P0 | New architecture modules are not wired to `studio.js` | Build one source -> semantic model scene -> glTF -> anchor -> label -> selection -> presentation path |
| P0 | Source document extraction flattens important structural locators | Keep page, slide, sheet and cell IDs; verify extracted evidence against original |
| P0 | Model runtime loads arbitrary ArrayBuffer via parseAsync but lacks model integrity, size budgets, external URI policy | Support verified self-contained GLB first; require hash, content/triangle/texture budgets; controlled glTF resolver later |
| P0 | Semantic component mapping to model node paths not persistent or revision-safe | Persist asset hash + mapping + rebinding status; fail closed on mismatched model revision |
| P1 | `annotation-layout.js` was showing offscreen and behind-camera labels | Added early filtering and small-screen fallback; further 3D occlusion still required |
| P1 | Labels use greedy two-column placement and simple elbows | Add deterministic prioritization, clustering, screen-edge safe areas, line crossing penalty and depth occlusion |
| P1 | Spatial grid layout is not suitable for a model-centric scene | Separate model-centric stage layout from diagram and analytical layouts |
| P1 | Camera fit only considers panel bounds, not full model mesh | Fit model bounding sphere with safe-area projection and minimum readable label sizes |
| P1 | Model resource disposal assumes sole ownership | Introduce reference-counted asset cache; avoid disposing shared materials/textures |
| P1 | Gesture inference currently part of alpha app lifecycle | Worker where supported, bounded frame queue, explicit gesture statechart and fallback |
| P1 | Source numeric parsing can misinterpret locale commas | Strict locale/unit normalization; explicit transformations and missing values |
| P1 | Test files are contract tests only; no proven screenshot parity | Add Playwright visual regression, real glTF fixtures, import fixtures, browser/GPU fallback |
| P2 | Renderer choice could be prematurely tied to experimental WebGPU | Stable WebGL2 first, renderer adapter for future WebGPU/TSL; R3F v10 is alpha |
| P2 | Existing CDN imports undermine reproducible dependency review | Package manager, lockfile, dependency/license/security review before migration |

## Delivery operating model
**Architecture lead:** owns domain schemas, boundaries and compatibility.
**Graphics lead:** owns model assets, transforms, camera, shaders, performance, picking and visual acceptance.
**Content/evidence lead:** owns parsing, source locators, provenance, formulas and verification.
**Interaction lead:** owns presenter state machine, gestures and keyboard parity.
**QA lead:** owns deterministic fixtures, screenshot comparisons, accessibility, security and failure testing.
These are workstream responsibilities, not a claim that separate people are staffed.

## One end-to-end proof before breadth
Choose a **licensed, genuine glTF asset with 5+ selectable nested parts**. Use a documented source bundle with 3 evidence-backed annotations. Required path:

1. Import source and self-contained GLB; record hash and locator.
2. Build explicit semantic component mappings to glTF node IDs.
3. Validate mappings and evidence IDs before compilation.
4. Compile a model scene and deterministic model-centered RenderPlan.
5. Load real mesh hierarchy, frame model, render labels outside focal object.
6. Select component with raycaster, highlight, reveal source evidence.
7. Rotate/zoom; labels follow their anchors; invisible/occluded labels hide or cluster.
8. Trigger same commands by keyboard/mouse and optionally gestures.
9. Save and reload the scene with source mapping intact.
10. Verify visual snapshots at 1920x1080, 1366x768 and 768x1024, plus denied camera and WebGL fallback.

**Exit criteria:** zero overlapping visible labels; no connector through the focal object's projected silhouette; all visible facts source-backed; no selection ambiguity for fixture; readable typography; no memory leak on repeated scene transitions; browser tests actually pass. Targets are acceptance criteria, not achieved metrics.

## Priority sequencing
**Gate 0 — Reproducible baseline:** lock dependencies, run existing tests, establish screenshots and record current failures.
**Gate 1 — Vertical slice:** wire glTF, semantic mapping, camera, anchor overlay and selection in live studio.
**Gate 2 — Visual polish:** model-centered layout, occlusion, clustering, lighting/material presets, responsive typography.
**Gate 3 — Source intelligence:** provenance-preserving import, charts, process/network relationships, authoring controls.
**Gate 4 — Interaction:** presenter actor, worker gestures, calibration, failover.
**Gate 5 — Reliability:** asset budgets, offline, migrations, performance profiling, export and security.
Do not start Gate 3–5 as broad parallel feature work before Gate 1 is demonstrated.

## Technology verification
- React Three Fiber v9 is stable for React 19; v10 WebGPU branch remains alpha: https://r3f.docs.pmnd.rs/getting-started/introduction
- Three.js WebGPURenderer has WebGL2 fallback but shader/postprocessing incompatibilities and remains experimental: https://threejs.org/manual/pages/webgpurenderer
- MediaPipe detectForVideo is synchronous and documentation recommends workers: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js

## Leadership guardrails
No random scraping or unlicensed copying. Evaluate each upstream project for maintenance, license, compatibility, security, actual problem solved and measured benefit. Keep an attribution/third-party inventory. Do not introduce microservices, CRDT, WebXR or novel shader stacks without demonstrated product requirements. Every milestone must ship an integrated, tested behavior, not just files in `architecture/`.

**Next decisive action:** build and verify the single real-model vertical slice in the existing app, then use that as the architecture's acceptance test.
