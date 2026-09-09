# Birustock Producer UI V15

Target: Producer repo `birustockidv1`.

This patch refines the V14 three-column workspace:
- stable desktop proportions: Library 260px / Editor >=500px / Preview 360px
- no sticky editor footer, so it cannot cover editor cards
- preview stays in normal flow within its own pane
- public preview cards use proportional 16:9 media frames
- text wraps safely inside narrow preview cards
- at <=1319px CSS width, layout becomes Library + Editor with Preview below to avoid a cramped middle column
- at <=900px, the layout becomes a single-column flow

Replace only `src/styles.css` unless your current `src/studio.tsx` differs from this package.
Run `npm run typecheck` then `npm run build` before commit.
