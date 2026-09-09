# Birustock Producer — V14 isolated 3-column workspace

Target repo: `jagoananalis/birustockidv1` (Producer only).

This patch fixes the overlap problem by giving each desktop pane its own scroll context:

- Sidebar: existing Producer navigation.
- Library: fixed grid column, internal scroll only.
- Editor: fixed grid column, internal vertical scroll only.
- Public Preview: fixed grid column, internal vertical scroll only.

No pane uses absolute/fixed positioning to float over another pane.

Files to replace:
- `src/styles.css`
- `src/routes/studio.tsx` (included for parity with V13; no functional logic change intended)

Recommended: replace `styles.css` first. `studio.tsx` is not required if the current V13 code already matches the bundled layout.

Verify before commit:

```bash
npm run typecheck
npm run build
```
