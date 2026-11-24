import { clsx } from 'clsx'
import { partition } from './utils.js'

// Prevent TS2742 error
export type ClassValue =
  | ClassArray
  | ClassDictionary
  | string
  | number
  | bigint
  | null
  | boolean
  | undefined
export type ClassDictionary = Record<string, any>
export type ClassArray = ClassValue[]

type OmitUndefined<T> = T extends undefined ? never : T
type StringOrBoolean<T> = T extends 'true' | 'false' ? boolean | 'true' | 'false' : T
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never
type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {}

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  'class' | 'className'
>

type ClassProp =
  | { class?: ClassValue; className?: never }
  | { class?: never; className?: ClassValue }

// Fold
type FoldVariantShape = Record<string, Record<string, ClassValue>>
type FoldVariantSchema<V extends FoldVariantShape> = {
  [Variant in keyof V]?: StringOrBoolean<keyof V[Variant]> | undefined
}
type FoldCompoundVariantSchema<V extends FoldVariantShape> = {
  [Variant in keyof V]?:
    | StringOrBoolean<keyof V[Variant]>
    | StringOrBoolean<keyof V[Variant]>[]
    | undefined
}
type FoldCompoundVariants<V extends FoldVariantShape> = (V extends FoldVariantShape
  ? (FoldVariantSchema<V> | FoldCompoundVariantSchema<V>) & ClassProp
  : ClassProp)[]

type FoldVariantKeys<V> = V extends FoldVariantShape ? Extract<keyof V, string>[] : never
type FoldConfig<V> = { base?: ClassValue } & (V extends FoldVariantShape
  ? {
      variants: V
      compoundVariants?: FoldCompoundVariants<V>
      defaultVariants?: FoldVariantSchema<V>
    }
  : {
      variants?: never
      compoundVariants?: never
      defaultVariants?: never
    })
export interface FoldPartitionFn<V> {
  <P extends Record<string, unknown>>(
    props: P,
  ): [
    variants: Simplify<Pick<P, FoldVariantKeys<V>[number]>>,
    otherProps: Simplify<Omit<UnionToIntersection<P>, FoldVariantKeys<V>[number]>>,
  ]
}
type FoldProps<V> = V extends FoldVariantShape ? FoldVariantSchema<V> & ClassProp : ClassProp
type FoldInnerFn<V> = (props?: FoldProps<V>) => string
export type FoldAugmentedInnerFn<V> = FoldInnerFn<V> & {
  variantKeys: FoldVariantKeys<V>
  config: Readonly<FoldConfig<V>>
  partition: FoldPartitionFn<V>
}

// Compose
type ComposeVariantKeys<T extends FoldAugmentedInnerFn<any>[]> = Array<
  keyof UnionToIntersection<{ [K in keyof T]: VariantProps<T[K]> }[number]> & string
>
type ComposeConfigs<T extends FoldAugmentedInnerFn<any>[]> = {
  [K in keyof T]: T[K]['config']
}
export interface ComposePartitionFn<T extends FoldAugmentedInnerFn<any>[]> {
  <P extends Record<string, unknown>>(
    props: P,
  ): [
    variants: Simplify<Pick<P, ComposeVariantKeys<T>[number]>>,
    otherProps: Simplify<Omit<UnionToIntersection<P>, ComposeVariantKeys<T>[number]>>,
  ]
}
type ComposeProps<T extends FoldAugmentedInnerFn<any>[]> = (
  | UnionToIntersection<{ [K in keyof T]: VariantProps<T[K]> }[number]>
  | undefined
) &
  ClassProp
type ComposeInnerFn<T extends FoldAugmentedInnerFn<any>[]> = (props?: ComposeProps<T>) => string
export type ComposeAugmentedInnerFn<T extends FoldAugmentedInnerFn<any>[]> = ComposeInnerFn<T> & {
  variantKeys: ComposeVariantKeys<T>
  configs: ComposeConfigs<T>
  partition: ComposePartitionFn<T>
}

export interface Resolver {
  (...inputs: ClassValue[]): string
}

export interface Fold {
  <V>(config: FoldConfig<V>): FoldAugmentedInnerFn<V>
}

export interface FoldConfigShape {
  <V>(config: FoldConfig<V>): Readonly<FoldConfig<V>>
}

export interface Compose {
  <T extends FoldAugmentedInnerFn<any>[]>(...components: [...T]): ComposeAugmentedInnerFn<T>
}

type DefineConfigOptions = {
  hooks?: {
    /**
     *
     * @param className string of class names
     * @returns (modified) string of class names
     */
    onResolve?: (className: string) => string
  }
}

export interface DefineConfig {
  (options?: DefineConfigOptions): {
    cx: Resolver
    fold: Fold
    foldConfig: FoldConfigShape
    compose: Compose
  }
}

/** Most results one recipe (or composed recipe) keeps. Once full, the oldest entry is dropped. */
const CACHE_LIMIT = 256

const cacheSet = (cache: Map<string, string>, key: string, value: string): void => {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  cache.set(key, value)
}

// Separators inside cache keys. Class names and variant values don't contain these characters.
const VALUE_END = '\u0000'
const CALLER_CLASSES_START = '\u0001'

/**
 * Encodes a variant value for a cache key. Resolving compares values by their String() form only,
 * so true and 'true' share an entry. A missing value always falls back to the same default
 * (null or undefined) within one recipe, so one marker covers both.
 */
const encodeValue = (value: unknown): string => (value == null ? '-' : '=' + String(value))

/** Joins two class strings the way clsx does. */
const joinClasses = (first: string, second: string): string =>
  first && second ? first + ' ' + second : first || second

interface CompoundCondition {
  key: string
  /** String forms of an array condition's options, or null for a single-value condition. */
  options: string[] | null
  /** String form of a single-value condition. */
  text: string
}

interface Compound {
  conditions: CompoundCondition[]
  klass: ClassValue
  className: ClassValue
}

type CompoundEntry = Record<string, unknown> & { class?: ClassValue; className?: ClassValue }

/**
 * Values are compared by their String() form, like variant lookups: true matches true and 'true'.
 * An array condition matches when the value equals one of its options.
 */
const matchesCondition = (value: unknown, condition: CompoundCondition): boolean => {
  const text = String(value)
  return condition.options ? condition.options.includes(text) : text === condition.text
}

const typedKeys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[]

export const defineConfig: DefineConfig = (options) => {
  const onResolve = options?.hooks?.onResolve

  const cx: Resolver = (...inputs: ClassValue[]) =>
    onResolve ? onResolve(clsx(...inputs)) : clsx(...inputs)

  const fold: Fold = (config) => {
    const { variants, defaultVariants, compoundVariants } = config ?? {}
    const variantMap = (variants ?? {}) as Record<string, Record<string, ClassValue>>
    const defaults = defaultVariants as Record<string, unknown> | undefined

    const variantKeys = variants ? typedKeys(variants) : []
    const variantNames = variantKeys as string[]

    // Compound variants only apply to recipes that have variants
    const compoundEntries = (variants ? (compoundVariants ?? []) : []) as CompoundEntry[]
    const compounds: Compound[] = compoundEntries.map(
      ({ class: klass, className, ...conditions }) => ({
        klass,
        className,
        conditions: Object.entries(conditions).map(([key, expected]) => ({
          key,
          options: Array.isArray(expected) ? expected.map(String) : null,
          text: String(expected),
        })),
      }),
    )

    // Every prop that can change the variant classes: the variants, plus any other key a compound checks
    const keyNames = [
      ...new Set([
        ...variantNames,
        ...compounds.flatMap(({ conditions }) => conditions.map(({ key }) => key)),
      ]),
    ]

    const baseClasses = clsx(config?.base)

    // The prop's own value, or its default when the prop is null or undefined
    const valueOf = (props: Record<string, unknown> | undefined, key: string): unknown =>
      props?.[key] ?? defaults?.[key]

    // Base, variant and compound classes for these props, joined but not yet passed to onResolve
    const resolveVariantClasses = (props: Record<string, unknown> | undefined): string => {
      const classes: ClassValue[] = [baseClasses]

      for (const name of variantNames) {
        const value = valueOf(props, name)
        classes.push(value == null ? null : variantMap[name][String(value)])
      }

      for (const { conditions, klass, className } of compounds) {
        if (
          conditions.every((condition) =>
            matchesCondition(valueOf(props, condition.key), condition),
          )
        ) {
          classes.push(klass, className)
        }
      }

      return clsx(classes)
    }

    // Keyed by the effective variant values: the classes before onResolve
    const variantCache = new Map<string, string>()
    // Keyed by the effective variant values plus the caller's classes: the final result
    const resultCache = new Map<string, string>()

    const variantClassesFor = (key: string, props: Record<string, unknown> | undefined): string => {
      let classes = variantCache.get(key)
      if (classes === undefined) {
        classes = resolveVariantClasses(props)
        cacheSet(variantCache, key, classes)
      }
      return classes
    }

    const resolve = ((props) => {
      const values = props as Record<string, unknown> | undefined

      let key = ''
      for (const name of keyNames) key += encodeValue(valueOf(values, name)) + VALUE_END

      const klass = values?.class as ClassValue
      const className = values?.className as ClassValue
      const callerClasses = klass || className ? clsx(klass, className) : ''

      if (!onResolve) return joinClasses(variantClassesFor(key, values), callerClasses)

      const resultKey = callerClasses ? key + CALLER_CLASSES_START + callerClasses : key
      let result = resultCache.get(resultKey)
      if (result === undefined) {
        result = onResolve(joinClasses(variantClassesFor(key, values), callerClasses))
        cacheSet(resultCache, resultKey, result)
      }
      return result
    }) as ReturnType<Fold>

    return Object.assign(resolve, {
      variantKeys,
      config: Object.freeze(config),
      // partition: (props : any) => ({ // any is overriden by interface
      // 	variants: pick(props, variantKeys),
      // 	otherProps: omit(props, variantKeys),
      // })
      partition: (props: any) => partition(props, variantKeys), // any is overriden by interface]
    })
  }

  // Infer the type of the config object
  const foldConfig: FoldConfigShape = (config) => config

  const compose: Compose = (...components) => {
    // Keyed by the joined classes: the onResolve result
    const resultCache = new Map<string, string>()

    const resolve = ((props = {}) => {
      const { class: klass, className, ...restProps } = props

      const joined = clsx(
        components.map((component) => component(restProps)),
        klass,
        className,
      )
      if (!onResolve) return joined

      let result = resultCache.get(joined)
      if (result === undefined) {
        result = onResolve(joined)
        cacheSet(resultCache, joined, result)
      }
      return result
    }) as ReturnType<Compose>

    const variantKeys = [
      ...new Set(components.flatMap((component) => component.variantKeys)),
    ] as ComposeVariantKeys<typeof components>
    const configs = [...new Set(components.map((component) => component.config))] as ComposeConfigs<
      typeof components
    >

    return Object.assign(resolve, {
      variantKeys,
      configs,
      // partition: (props : any) => ({ // any is overriden by interface
      // 	variants: pick(props, variantKeys),
      // 	otherProps: omit(props, variantKeys),
      // })
      partition: (props: any) => partition(props, variantKeys), // any is overriden by interface]
    })
  }

  return { cx, fold, foldConfig, compose } satisfies ReturnType<DefineConfig>
}

export const { cx, fold, foldConfig, compose } = defineConfig()
