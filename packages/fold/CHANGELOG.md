# @grainshape/fold

## 0.1.0

### Minor Changes

- aa8bb3f: Cache resolved class strings per recipe. Repeated calls to a `fold()` or `compose()` recipe with the same variant values and `class`/`className` are now 2–3× faster. `onResolve` now runs once per unique class string per recipe instead of on every call, so it should be a pure function.

### Patch Changes

- 753d878: Fix compound array conditions for boolean and numeric props. Array conditions now compare values as text, like single-value conditions, so a `true` prop matches `[true]` and `['true']`, `false` matches `[false, true]`, and `gap: 1` matches `[1, 2]`. Before, these never matched.
- Include the NOTICE file with the CVA attribution in the published package, and link the package to its GitHub repository.

## 0.0.2

### Patch Changes

- 9f8586a: Add README with full API documentation. Expand test coverage to include compound variant array conditions, `className` in compound variants, `class`/`className` mutual exclusion with variants, and `partition()` edge cases (empty object, no matching keys).
- 8218992: Add MIT LICENSE file and NOTICE with Apache 2.0 attribution for CVA (class-variance-authority) by Joe Bell, from which core variant resolution logic is derived.
