# @grainshape/fold

[![npm version](https://img.shields.io/npm/v/@grainshape/fold)](https://www.npmjs.com/package/@grainshape/fold)
[![license](https://img.shields.io/npm/l/@grainshape/fold)](./LICENSE)

Type-safe class variant resolver. Define component variants as a config object, get back a strongly-typed function that resolves the right class string at runtime.

Based on [CVA](https://cva.style) by [Joe Bell](https://github.com/joe-bell). Adds `foldConfig()` for lossless type preservation, a `partition()` method for framework-friendly prop splitting, and fixes several TypeScript inference issues present in CVA's type signatures.

---

## Install

```bash
pnpm add @grainshape/fold
```

If you are using Tailwind and want automatic class conflict resolution, use [`@grainshape/tw-fold`](../tw-fold) instead.

---

## Basic usage

```ts
import { fold } from '@grainshape/fold'

const button = fold({
  base: 'font-medium rounded',
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-100 text-gray-900',
    },
    size: {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
  },
})

button()                              // 'font-medium rounded bg-blue-500 text-white px-4 py-2'
button({ intent: 'secondary' })       // 'font-medium rounded bg-gray-100 text-gray-900 px-4 py-2'
button({ size: 'sm' })                // 'font-medium rounded bg-blue-500 text-white px-2 py-1 text-sm'
button({ class: 'w-full' })           // appends 'w-full' to the resolved string
```

---

## Compound variants

Apply additional classes when a specific combination of variants is active.

```ts
const button = fold({
  base: 'font-medium rounded',
  variants: {
    intent: {
      primary: 'bg-blue-500',
      secondary: 'bg-gray-100',
    },
    size: {
      sm: 'text-sm',
      lg: 'text-lg',
    },
  },
  compoundVariants: [
    // single value match
    { intent: 'primary', size: 'lg', class: 'uppercase tracking-wide' },
    // array match — applies when size is 'sm' or 'lg'
    { intent: 'secondary', size: ['sm', 'lg'], class: 'border border-gray-300' },
  ],
})
```

---

## Compose

Merge multiple fold functions into one. All variant keys are combined; each component only receives the props it knows about.

```ts
import { fold, compose } from '@grainshape/fold'

const box = fold({
  variants: {
    shadow: { sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' },
  },
})

const stack = fold({
  variants: {
    gap: { 1: 'gap-1', 2: 'gap-2', 4: 'gap-4' },
    direction: { row: 'flex-row', col: 'flex-col' },
  },
})

const card = compose(box, stack)

card({ shadow: 'md', gap: 2, direction: 'col' })
// 'shadow-md gap-2 flex-col'
```

The composed function is fully typed — `shadow`, `gap`, and `direction` are all inferred from their respective configs.

---

## `partition()`

Every fold and compose result exposes a `partition()` method that splits an arbitrary props object into `[variantProps, otherProps]`. This is particularly useful in **Svelte**, where spreading unknown props onto a DOM element causes attribute warnings.

```svelte
<!-- Button.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte'
  import { fold, type VariantProps } from '@grainshape/fold'

  const styles = fold({
    base: 'font-medium rounded',
    variants: {
      intent: {
        primary: 'bg-blue-500 text-white',
        secondary: 'bg-gray-100 text-gray-900',
      },
      size: { sm: 'px-2 py-1', md: 'px-4 py-2' },
    },
    defaultVariants: { intent: 'primary', size: 'md' },
  })

  type Props = VariantProps<typeof styles> & {
    children?: Snippet
    // any other props, e.g. native button attributes
    [key: string]: unknown
  }

  let { children, ...props }: Props = $props()

  // variantProps = { intent, size }  (only what fold knows about)
  // restProps   = { onclick, disabled, ... } (everything else — reactive)
  let [variantProps, restProps] = $derived(styles.partition(props))
</script>

<button class={styles(variantProps)} {...restProps}>
  {@render children?.()}
</button>
```

`partition()` is fully typed — `variantProps` contains only the known variant keys, `restProps` contains everything else, both inferred from the shape of the input.

---

## `cx()`

A `clsx`-compatible utility, passed through any `onResolve` hook defined via `defineConfig`.

```ts
import { cx } from '@grainshape/fold'

cx('foo', undefined, false, 'bar')   // 'foo bar'
cx({ active: true, disabled: false }) // 'active'
```

---

## `foldConfig()`

A typed identity function that captures a config's full generic type without instantiating a fold. This was one of the original motivations for building fold over CVA.

**The problem with plain objects:** if you define a config as a plain object literal and pass it around, TypeScript widens the type — you lose the exact variant key literals. `foldConfig()` preserves them.

```ts
// Without foldConfig — type is widened, variant keys are lost
const config = {
  variants: { size: { sm: 'small', lg: 'large' } }
}
// typeof config.variants.size → Record<string, string> — 'sm' | 'lg' is gone

// With foldConfig — full type is preserved
import { foldConfig, fold } from '@grainshape/fold'

const buttonConfig = foldConfig({
  base: 'font-medium rounded',
  variants: {
    intent: { primary: 'bg-blue-500', secondary: 'bg-gray-100' },
  },
})
// typeof buttonConfig knows exactly: intent is 'primary' | 'secondary'

const button = fold(buttonConfig)
// button's props are still fully typed: { intent?: 'primary' | 'secondary' }
```

This matters most when sharing configs across components or when using `compose` — each component's `.config` property is typed exactly, and `compose.configs` returns a typed tuple rather than a generic array:

```ts
const boxConfig = foldConfig({
  variants: { shadow: { sm: 'shadow-sm', md: 'shadow-md' } },
})
const stackConfig = foldConfig({
  variants: { gap: { 1: 'gap-1', 2: 'gap-2' } },
})

const box = fold(boxConfig)
const stack = fold(stackConfig)
const card = compose(box, stack)

// card.configs is typed as [typeof boxConfig, typeof stackConfig]
// — not a generic array, the exact tuple shape is preserved
type Configs = typeof card.configs
// [Readonly<FoldConfig<...boxConfig shape...>>, Readonly<FoldConfig<...stackConfig shape...>>]
```

---

## `VariantProps`

Extract the variant props type from a fold or compose function.

```ts
import { fold, type VariantProps } from '@grainshape/fold'

const button = fold({
  variants: {
    intent: { primary: '...', secondary: '...' },
    size: { sm: '...', md: '...' },
  },
})

type ButtonProps = VariantProps<typeof button>
// { intent?: 'primary' | 'secondary'; size?: 'sm' | 'md' }
```

---

## Custom resolver (`defineConfig`)

Use `defineConfig` to create a custom instance of `fold`, `compose`, and `cx` with a post-processing hook on the resolved class string. This is how `@grainshape/tw-fold` adds `tailwind-merge` support.

```ts
import { defineConfig } from '@grainshape/fold'
import { twMerge } from 'tailwind-merge'

const { fold, compose, cx, foldConfig } = defineConfig({
  hooks: {
    onResolve: (className) => twMerge(className),
  },
})

export { fold, compose, cx, foldConfig }
```

---

## Caching

Each recipe made with `fold()` or `compose()` remembers its most recent results (up to 256). A repeated call with the same variant values and the same `class`/`className` returns the stored string without resolving or calling `onResolve` again. This makes repeated calls 2–3× faster.

Two rules follow from this:

- **`onResolve` should be a pure function.** It runs once per unique class string per recipe, not on every call. A hook whose output depends on anything other than its input, such as a counter or a global setting, can return stale results.
- **Treat a recipe's config as fixed once you've passed it to `fold()`.** Changing a variant's classes afterwards doesn't affect results that are already cached.

`cx()` is not cached.

---

## Credits

Built on top of the ideas and type patterns from [CVA](https://cva.style) by [Joe Bell](https://github.com/joe-bell). fold extends CVA's approach with `foldConfig()` for preserved generic types, `partition()` for prop splitting, and a `defineConfig()` factory for custom resolvers.

---

## License

MIT © John van Dijk

This package contains code derived from [CVA](https://github.com/joe-bell/cva) by Joe Bell (Apache 2.0). See [NOTICE](../../NOTICE) for details.
