# Iron Man Spatial Studio

A **desktop-first web alpha** for editing and presenting real-time 3D concept scenes. This is not a production-complete system.

## Run
Open `index.html` through a local HTTP server (for example `python -m http.server 4173`) and visit http://localhost:4173. The app imports Three.js from esm.sh; initial network access is necessary. Camera use requires localhost or HTTPS and explicit browser permission.

## Features implemented
- Three.js WebGL interactive 3D geometry and labels, orbit rotation and zoom
- Editable slides and nodes; orbit, grid and timeline arrangements
- Text, Markdown, CSV, JSON, PDF, DOCX, PPTX and spreadsheet extraction (15 MB maximum; third-party parsers load on demand)
- Local autosave, JSON project export and import
- Presentation dialog with a separate 3D canvas
- Keyboard and mouse fallback
- Opt-in webcam hand landmark tracking and deliberate hold-pinch to advance (not yet validated on a real device)
- GitHub Pages deployment workflow

## Not implemented
- AI topic research, semantic content-to-3D generation, true physical 3D model synthesis
- OCR, exact document layout reproduction, source citations and verification of extracted tables/figures
- Cloud database sync, accounts, team collaboration or version history
- Full six-gesture recognition and gesture calibration
- Professional presenter rehearsal, video recording or genuine AR

## Security and privacy
Local projects use browser localStorage, not a remote database. The webcam stream is processed in-browser by MediaPipe; hand video is not uploaded by application code. Third-party scripts, models and assets load from public CDNs. Do not upload sensitive documents to an unreviewed build.

## Deployment
In GitHub repository Settings → Pages → Build and deployment, choose **GitHub Actions**. The workflow publishes on pushes to main. If the repo is private, GitHub Pages eligibility depends on account plan. GitHub Pages is public web hosting when enabled; do not store secrets in this repository.

## Known limitations
The app requires network access for Three.js and MediaPipe modules. Real-device browser and camera testing are pending. Import of JSON via the source-file input treats it as text; project JSON import is the separate **Import project** action. This release should not be relied upon for an important live event without rehearsing it on the actual laptop.


## Renderer architecture (current)
- `evidence-compiler.js` converts explicit source lines and structured CSV tables into scenes and evidence locators.
- `visual-contract.js` rejects missing, mixed or unsupported numerical series rather than inventing data.
- `spatial-renderer.js` builds real Three.js geometry: structured readable concept panels or value-faithful 3D bar charts with numeric axes and source-value labels.
- **No invented relationships:** concept panels are not automatically connected. Uploaded 3D meshes, CAD assembly inspection, semantic diagram inference, and physically accurate model generation are not yet supported.
- `e2e/studio.spec.js` and `.github/workflows/browser.yml` provide Chromium smoke tests. Verify green CI and rehearse with the actual laptop before presenting.
- The current product is a functional **alpha under verification**, not a finished or fully tested professional product.
