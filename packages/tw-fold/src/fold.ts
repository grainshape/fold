import { defineConfig } from "@grainshape/fold";
import { twMerge } from "tailwind-merge";
import type { Fold, FoldConfigShape, Compose, Resolver, FoldAugmentedInnerFn, ComposeAugmentedInnerFn } from "@grainshape/fold";
export type { Fold, FoldConfigShape, Compose, Resolver, FoldAugmentedInnerFn, ComposeAugmentedInnerFn };
export type { VariantProps } from "@grainshape/fold";

const config = defineConfig({
	hooks: {
		onResolve: (className: string) => {
			return twMerge(className);
		}
	}
});

export const cx: Resolver = config.cx;
export const fold: Fold = config.fold;
export const foldConfig: FoldConfigShape = config.foldConfig;
export const compose: Compose = config.compose;
