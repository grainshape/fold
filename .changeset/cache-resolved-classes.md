---
'@grainshape/fold': minor
---

Cache resolved class strings per recipe. Repeated calls to a `fold()` or `compose()` recipe with the same variant values and `class`/`className` are now 2–3× faster. `onResolve` now runs once per unique class string per recipe instead of on every call, so it should be a pure function.
