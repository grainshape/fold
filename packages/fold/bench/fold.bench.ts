import { bench, describe } from 'vitest'

import { compose, fold } from '../src/fold.js'

const button = fold({
  base: 'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium',
  variants: {
    intent: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-gray-100 text-gray-900',
      ghost: 'bg-transparent',
    },
    size: { sm: 'px-2 py-1 text-xs', md: 'px-3 py-2 text-sm', lg: 'px-5 py-3 text-base' },
    disabled: { true: 'pointer-events-none opacity-50', false: 'cursor-pointer' },
  },
  compoundVariants: [
    { intent: 'primary', size: 'lg', class: 'shadow-lg' },
    { intent: ['secondary', 'ghost'], disabled: false, class: 'hover:bg-gray-200' },
  ],
  defaultVariants: { intent: 'primary', size: 'md', disabled: false },
})

type ButtonProps = NonNullable<Parameters<typeof button>[0]>

const VARIANT_PROPS: ButtonProps[] = [
  {},
  { intent: 'secondary' },
  { intent: 'ghost', size: 'sm' },
  { size: 'lg' },
  { intent: 'primary', size: 'lg', disabled: true },
]

const CLASS_PROPS: ButtonProps[] = [
  { class: 'w-full' },
  { intent: 'secondary', class: 'px-8' },
  { size: 'lg', class: 'mt-2 rounded-full' },
  { intent: 'ghost', className: 'text-red-500' },
]

const box = fold({
  variants: { shadow: { sm: 'shadow-sm', md: 'shadow-md' } },
  defaultVariants: { shadow: 'sm' },
})
const stack = fold({
  variants: { gap: { unset: null, 1: 'gap-1', 2: 'gap-2', 3: 'gap-3' } },
  defaultVariants: { gap: 'unset' },
})
const card = compose(box, stack)

type CardProps = NonNullable<Parameters<typeof card>[0]>

const CARD_PROPS: CardProps[] = [
  {},
  { shadow: 'md' },
  { gap: 2 },
  { shadow: 'md', gap: 3, class: 'p-4' },
]

let i = 0

describe('fold (no merge)', () => {
  bench('variants, repeated props', () => {
    button(VARIANT_PROPS[i++ % VARIANT_PROPS.length])
  })

  bench('variants + caller class, repeated props', () => {
    button(CLASS_PROPS[i++ % CLASS_PROPS.length])
  })

  bench('unique caller class on every call', () => {
    button({ intent: 'secondary', class: `w-[${i++}px]` })
  })

  bench('compose of two recipes', () => {
    card(CARD_PROPS[i++ % CARD_PROPS.length])
  })
})
