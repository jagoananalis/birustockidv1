# Producer V19 — Local Cache / Draft Recovery

Target: `birustockidv1` (Producer).

Adds browser-local persistence using localStorage for:
- last opened Studio tab
- global selected content
- Analisis: current form, query, status filter, active section
- News: current form, query, active section
- Edukasi: current form, query, active section

The current unsaved editor draft is restored after refresh/reopen of the Studio.
A successful save/delete clears the corresponding local draft cache. Storage failures are ignored so the editor continues to work.
