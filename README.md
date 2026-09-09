# Birustock Producer V17 — Filled Editorial Workspace

Target repository: `birustockidv1` (Producer).

This patch keeps the V16 adaptive 3-column behavior and fixes the large empty
area beneath the active Analisis / News / Edukasi workspace by making the
editorial row fill the remaining viewport height on desktop.

The layout remains structurally ready for a future card/section below the
current workspace, but no extra feature/card is added in this version.

Changed file:
- `src/styles.css`

Validation:
- Run `npm run typecheck`
- Run `npm run build`
- Check `/studio/analisis`, `/studio/news`, `/studio/edukasi` at 80–125% zoom.
