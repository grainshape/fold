import { clsx } from 'clsx';
import { partition } from './utils.js';

// Prevent TS2742 error
export type ClassValue = ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined;
export type ClassDictionary = Record<string, any>;
export type ClassArray = ClassValue[];

type OmitUndefined<T> = T extends undefined ? never : T;
type StringOrBoolean<T> = T extends 'true' | 'false' ? boolean | 'true' | 'false' : T;
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void ? I : never;
type Simplify<T> = {[KeyType in keyof T]: T[KeyType]} & {};

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  "class" | "className"
>;

type ClassProp =
    | { class?: ClassValue; className?: never; }
    | { class?: never; className?: ClassValue; };

// Fold
type FoldVariantShape = Record<string, Record<string, ClassValue>>;
type FoldVariantSchema<V extends FoldVariantShape> = {
	[Variant in keyof V]?:
		| StringOrBoolean<keyof V[Variant]>
		| undefined;
};
type FoldCompoundVariantSchema<V extends FoldVariantShape> = {
	[Variant in keyof V]?:
		| StringOrBoolean<keyof V[Variant]>
		| StringOrBoolean<keyof V[Variant]>[]
		| undefined;
};
type FoldCompoundVariants<V extends FoldVariantShape> =
	(V extends FoldVariantShape ? (FoldVariantSchema<V> | FoldCompoundVariantSchema<V>) & ClassProp : ClassProp)[];

type FoldVariantKeys<V> = V extends FoldVariantShape ? Extract<keyof V, string>[] : never;
type FoldConfig<V> = { base?: ClassValue } & (
	V extends FoldVariantShape
	? {
		variants: V;
		compoundVariants?: FoldCompoundVariants<V>;
		defaultVariants?: FoldVariantSchema<V>;
	}
	: {
		variants?: never;
		compoundVariants?: never;
		defaultVariants?: never;
	}
);
export interface FoldPartitionFn<V> {
	<P extends Record<string, unknown>>(props: P): [
        variants: Simplify<Pick<P, FoldVariantKeys<V>[number]>>,
        otherProps: Simplify<Omit<UnionToIntersection<P>, FoldVariantKeys<V>[number]>>
    ];
}
type FoldProps<V> = V extends FoldVariantShape ? FoldVariantSchema<V> & ClassProp : ClassProp;
type FoldInnerFn<V> = (props?: FoldProps<V>) => string;
export type FoldAugmentedInnerFn<V> = FoldInnerFn<V> & {
	variantKeys: FoldVariantKeys<V>;
	config: Readonly<FoldConfig<V>>;
	partition: FoldPartitionFn<V>;
};

// Compose
type ComposeVariantKeys<T extends FoldAugmentedInnerFn<any>[]> = Array<
	keyof UnionToIntersection<{ [K in keyof T]: VariantProps<T[K]> }[number]> & string
>;
type ComposeConfigs<T extends FoldAugmentedInnerFn<any>[]> = {
	[K in keyof T]: T[K]['config'];
};
export interface ComposePartitionFn<T extends FoldAugmentedInnerFn<any>[]> {
	<P extends Record<string, unknown>>(props: P): [
		variants: Simplify<Pick<P, ComposeVariantKeys<T>[number]>>,
		otherProps: Simplify<Omit<UnionToIntersection<P>, ComposeVariantKeys<T>[number]>>
	];
}
type ComposeProps<T extends FoldAugmentedInnerFn<any>[]> = (
	| UnionToIntersection<{ [K in keyof T]: VariantProps<T[K]> }[number]>
	| undefined
) &	ClassProp;
type ComposeInnerFn<T extends FoldAugmentedInnerFn<any>[]> = (props?: ComposeProps<T>) => string;
export type ComposeAugmentedInnerFn<T extends FoldAugmentedInnerFn<any>[]> = ComposeInnerFn<T> & {
	variantKeys: ComposeVariantKeys<T>;
	configs: ComposeConfigs<T>;
	partition: ComposePartitionFn<T>;
};

export interface Resolver {
	(...inputs: ClassValue[]): string;
}

export interface Fold {
	<V>(config: FoldConfig<V>) : FoldAugmentedInnerFn<V>;
}

export interface FoldConfigShape {
	<V>(config: FoldConfig<V>) : Readonly<FoldConfig<V>>;
}

export interface Compose {
	<T extends FoldAugmentedInnerFn<any>[]>(...components: [...T]): ComposeAugmentedInnerFn<T>;
}

type DefineConfigOptions = { hooks?: {
	/**
	 *
	 * @param className string of class names
	 * @returns (modified) string of class names
	 */
	onResolve?: (className: string) => string;
}}

export interface DefineConfig {
	(options?: DefineConfigOptions): {
		cx: Resolver;
		fold: Fold;
		foldConfig: FoldConfigShape;
		compose: Compose;
	};
}


const filterNullish = <T extends object>(obj: T): Partial<T> => Object.fromEntries(
	Object.entries(obj).filter(([_, value]) => value != null)
) as Partial<T>;

const typedKeys = <T extends object>(obj: T): (keyof T)[] =>
	Object.keys(obj) as (keyof T)[];

export const defineConfig : DefineConfig = (options) => {

	const cx : Resolver = (...inputs: ClassValue[]) => {
		if (options?.hooks?.onResolve) {
			return options.hooks.onResolve(clsx(...inputs));
		}

		return clsx(...inputs);
	};

	const fold : Fold = (config) => {

		const { variants, defaultVariants, compoundVariants } = config ?? {};

		const resolve = ((props) => {
		  	if (!variants) return cx(config?.base, props?.class, props?.className);

			const resolvedVariants = typedKeys(variants).map((variant) => {
				const variantProp = props?.[variant as keyof typeof props] ?? defaultVariants?.[variant];
				if (variantProp == null) return null;

				const variantKey = String(variantProp);
				return variants[variant][variantKey];
			});

			const mergedProps = {
				...defaultVariants,
				...(props ? filterNullish(props) : {}),
			}

			const resolvedCompoundVariants = compoundVariants?.reduce(
				(classes, { class: klass, className, ...conditions }) => {
					const matches = Object.entries(conditions).every(
						([key, expectedValue]) => {
						const actualValue = mergedProps[key as keyof typeof mergedProps];
						return actualValue && Array.isArray(expectedValue)
							? (expectedValue.map(String) as any[]).includes(actualValue)
							: String(actualValue) === String(expectedValue);
						}
					);

					return matches ? [...classes, klass, className] : classes;
				},
				[] as ClassValue[]
			);

			return cx(
				config.base,
				resolvedVariants,
				resolvedCompoundVariants,
				props?.class,
				props?.className
			);
		}) as ReturnType<Fold>;

		const variantKeys = variants ? typedKeys(variants) : [];
		return Object.assign(resolve, {
			variantKeys,
			config: Object.freeze(config),
			// partition: (props : any) => ({ // any is overriden by interface
			// 	variants: pick(props, variantKeys),
			// 	otherProps: omit(props, variantKeys),
			// })
			partition: (props: any) => partition(props, variantKeys) // any is overriden by interface]
		});
	};

	// Infer the type of the config object
	const foldConfig: FoldConfigShape = (config) => config

	const compose : Compose = (...components) => {
		const resolve = ((props = {}) => {
			const { class: klass, className, ...restProps } = props;

			const classes = components.map((component) => component(restProps));

			return cx(classes, klass, className);
		}) as ReturnType<Compose>;

		const variantKeys = [...new Set(components.flatMap((component) => component.variantKeys))] as ComposeVariantKeys<typeof components>;
		const configs = [...new Set(components.map((component) => component.config))] as ComposeConfigs<typeof components>;

		return Object.assign(resolve, {
			variantKeys,
			configs,
			// partition: (props : any) => ({ // any is overriden by interface
			// 	variants: pick(props, variantKeys),
			// 	otherProps: omit(props, variantKeys),
			// })
			partition: (props: any) => partition(props, variantKeys) // any is overriden by interface]
		});
	};

	return { cx, fold, foldConfig, compose } satisfies ReturnType<DefineConfig>;
};

export const { cx, fold, foldConfig, compose } = defineConfig();
