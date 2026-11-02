# Spatial object hierarchy and annotation integration — ADR 005

**Status:** Architecture adapters committed, integration with live `studio.js` still pending.

## Real open-source foundations (not copied wholesale)

- Three.js GLTFLoader and animation: https://threejs.org/docs/pages/GLTFLoader and https://threejs.org/manual/pages/animation-system.html
- Three.js recommended glTF delivery: https://threejs.org/manual/pages/loading-3d-models.html
- React Three Fiber component architecture: https://r3f.docs.pmnd.rs/
- Three Mesh BVH for fast picking of **static** triangle geometry: https://github.com/gkjohnson/three-mesh-bvh (MIT; not suitable as-is for skinned/morph-animated geometry)
- ELK.js for layered, evidence-backed diagrams: https://github.com/kieler/elkjs (EPL-2.0 or GPL-3.0-or-later; retain license obligations)
- Khronos glTF sample models: https://github.com/KhronosGroup/glTF-Sample-Models (asset-specific licensing must be checked; not automatically public domain).

## The hierarchy

Project -> Source assets -> Semantic scene -> Model asset -> glTF scene root -> nested components -> mesh/material/animation -> semantic anchors -> evidence-backed annotations.

The source's glTF hierarchy is preserved; do not flatten it. Each node has a deterministic path within a model revision. **Important:** paths are stable only within that asset revision and hierarchy; a re-export can change them. Durable authoring annotations require a separate semantic mapping table and explicit rebind/review on asset replacement.

`architecture/model-runtime.js` implements GLB parsing from an ArrayBuffer, component indexing, world-space bounding-box anchors, node selection and resource disposal. This is a first adapter, not a complete optimized asset pipeline. External-resource glTF must be imported via a controlled asset resolver; raw `parseAsync(buffer,'')` is suitable for self-contained GLB and can fail for external URIs.

`architecture/annotation-layout.js` converts camera-projected component anchors to collision-aware HTML label positions, routes elbow connectors, reserves a central object-safe region, and **hides excess annotations instead of overlapping**. Projection must be recomputed after camera movement and model animation. Occlusion and behind-camera anchors require runtime filtering. Labels must carry explicit source evidence or show unverified status.

## Presentation rendering contract

1. Import real 3D asset; reject unknown extensions, unsupported resources and excessive size.
2. Build semantic component mapping with source asset hash, node path, optional glTF extras, annotation and evidence ID.
3. Center model within a defined 3D stage; compute world bounds and camera fit.
4. Render focal object; reserve UI-safe regions for labels and presenter.
5. Project 3D anchor into viewport after camera transforms.
6. Route labels outside protected object bounds; if not enough room, cluster or hide with accessible inspector.
7. Select component via raycasting; map selected mesh to semantic component and evidence.
8. Highlight only selected component; expose provenance and real data.
9. Preserve animations and hierarchy; avoid claiming anatomically or mechanically correct dynamics without validated source.
10. Release geometry, textures and materials on unload; account for shared resources and cache ownership in future implementation.

## Integration boundary

```
Document evidence + model provenance
   -> semantic scene registry
   -> model-runtime (real glTF hierarchy)
   -> anchor projector
   -> annotation-layout (HTML overlay)
   -> render plan
   -> Three.js scene and presenter
```

No raw model names are treated as proof of anatomy or meaning. Semantic mapping and provenance remain explicit.

## Further hardening before live integration

- Asset license manifest, integrity hashes, glTF URI resolver, asset size/triangle/texture budgets.
- Semantic anchor rebinding after model revisions; world transform updates for animated/skinned components.
- Advanced label optimization: line crossings, depth occlusion, visual importance, screen-edge avoidance, clustered overflow.
- Shared-resource reference counts; GPU disposal cannot blindly destroy cached shared materials.
- Raycaster and optional BVH acceleration only for eligible static meshes.
- Automated screenshot comparison on desktop viewport sizes and model fixtures.
- WebGL context-loss recovery, keyboard accessibility and readable HTML fallback.

**No claim:** These adapters are not yet connected to the alpha renderer; committing them does not mean a heart model or arbitrary 3D asset is already visible in the application.
