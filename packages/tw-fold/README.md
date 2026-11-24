# @grainshape/tw-fold

[![npm version](https://img.shields.io/npm/v/@grainshape/tw-fold)](https://www.npmjs.com/package/@grainshape/tw-fold)
[![license](https://img.shields.io/npm/l/@grainshape/tw-fold)](./LICENSE)

`@grainshape/fold` pre-configured with [`tailwind-merge`](https://github.com/dcastil/tailwind-merge). Resolves class variants and automatically removes conflicting Tailwind classes.

---

## Install

```bash
pnpm add @grainshape/tw-fold
```

---

## Usage

The API is identical to `@grainshape/fold`. The only difference is that the resolved class string is passed through `twMerge` before being returned, so Tailwind class conflicts are resolved correctly.

```ts
import { fold } from '@grainshape/tw-fold'

const button = fold({
  base: 'text-green-500',
  variants: {
    intent: {
      primary: 'text-blue-500', // conflicts with base — twMerge keeps this one
      muted: 'opacity-50',
    },
  },
})

button({ intent: 'primary' }) // 'text-blue-500'  (not 'text-green-500 text-blue-500')
button({ intent: 'muted' }) // 'text-green-500 opacity-50'
```

Without `tailwind-merge` (plain `@grainshape/fold`), both `text-green-500` and `text-blue-500` would appear in the string and the last one in the stylesheet would win — which is fragile. `@grainshape/tw-fold` removes that ambiguity.

---

## Full API

All exports are re-exported from `@grainshape/fold`:

- `fold` — define variant configs
- `compose` — combine multiple fold functions
- `cx` — clsx-compatible utility (passed through `twMerge`)
- `foldConfig` — define reusable configs
- `VariantProps` — extract variant prop types

See the [`@grainshape/fold` documentation](https://www.npmjs.com/package/@grainshape/fold) for the full API reference.

---

## License

MIT © John van Dijk

This package includes `@grainshape/fold`, which contains code derived from [CVA](https://github.com/joe-bell/cva) by Joe Bell (Apache 2.0). See [NOTICE](../../NOTICE) for details.
