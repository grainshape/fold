---
'@grainshape/fold': patch
---

Fix compound array conditions for boolean and numeric props. Array conditions now compare values as text, like single-value conditions, so a `true` prop matches `[true]` and `['true']`, `false` matches `[false, true]`, and `gap: 1` matches `[1, 2]`. Before, these never matched.
