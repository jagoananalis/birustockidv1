# Birustock Producer — Analysis 600-word summary + action notifications

Target repo: `birustockidv1` (Producer only)

Files to replace:
- `src/studio.tsx` ← `studio.tsx`
- `src/lib/content.ts` ← `content.ts`
- `src/styles.css` ← `styles.css`

Changes:
- Analisis Ringkasan now allows up to 600 words (not 600 characters), with live word counter.
- Validation in `src/lib/content.ts` enforces max 600 words.
- Update/Publish/Delete actions for Analisis, News, and Edukasi show an animated loading toast, then success/error toast.
- Success/error notifications auto-dismiss after ~4.2s; loading stays until the action completes.
- Errors remain shown inline in the editor as before.

Do not copy `.env.local` or any environment files from the working project.
