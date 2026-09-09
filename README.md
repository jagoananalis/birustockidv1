# Birustock Producer V16 — Adaptive 3-Column Layout

Target repo: `jagoananalis/birustockidv1` (Producer only).

V16 fixes the remaining clipping/proportion issue seen on laptop/zoomed browser widths.

- Desktop with enough width: Library 220px | Editor >=460px | Preview 300px.
- When the viewport cannot safely fit those minima: switches to Library + Editor, with Preview below.
- Preview, editor, and library never overlap or escape their grid column.
- Preview cover remains 16:9 and text is constrained/wrapped.
- Editor header/action bar can wrap instead of overflowing horizontally.
- No database logic or route files are changed.

Install: replace `src/styles.css` with the included file.
Then run `npm run typecheck` and `npm run build` before committing.
