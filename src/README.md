Producer V20 — Image Upload

Target: birustockidv1 (Producer)

Changes:
- Image upload accepts up to 5 MB (JPG/PNG/WebP).
- Large images are resized to max 2200px and optimized client-side for the editor.
- Cached editor state remains smaller than storing the original large file whenever optimization runs.
- URL image input remains available.

No database, auth, route, or migration changes.
