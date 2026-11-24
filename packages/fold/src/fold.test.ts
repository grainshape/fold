import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { defineConfig, fold, foldConfig, compose, type VariantProps } from './fold.js';

describe('VariantProps', () => {

	it('should omit undefined properties', () => {
		const comp = fold({
			base: 'base-class',
			variants: {
				size: { sm: 'small', lg: 'large' },
				color: { red: 'text-red', blue: 'text-blue' },
			},
			defaultVariants: { size: 'lg', color: 'blue' }
		});
		type Result = VariantProps<typeof comp>;

		expectTypeOf<Result>().toEqualTypeOf<{ size?: 'sm' | 'lg'; color?: 'red' | 'blue' }>();
	});

	it('should handle components with no props', () => {
		const comp = fold({
			base: 'base-class'
		});
		type Result = VariantProps<typeof comp>;

		expectTypeOf<Result>().toEqualTypeOf<{}>();
	});

	it('should omit class and className props', () => {
		type ComponentProps = { class?: string; className?: string };
		type Result = VariantProps<(props: ComponentProps) => void>;

		expectTypeOf<Result>().toEqualTypeOf<{}>();
	});
});

describe('fold -> fn()', () => {
	// Basic Functionality
	it('should return a function', () => {
		const comp = fold({});
		expectTypeOf(comp).toBeFunction();
	});

	// No Base Cases
	describe('handling without base', () => {
		it('should handle an empty config', () => {
			const comp = fold({});
			expect(comp()).toBe('');
		});

		it('should handle no config', () => {
			// @ts-expect-error
			const comp = fold();
			expect(comp()).toBe('');
		});
	});

	it('should handle invalid props', () => {
		const comp = fold({});
		// @ts-expect-error
		expect(comp({ note: 'nope' })).toBe('');
	});

	it('should handle class and className correctly', () => {
		const example = fold({});
		expect(example({ class: 'class' })).toBe('class');
		expect(example({ className: 'className' })).toBe('className');
		// @ts-expect-error
		expect(example({ class: 'class', className: 'className' })).toBe('class className');
	});

	it('should reject both class and className when variants are present', () => {
		const comp = fold({
			variants: { size: { sm: 'small', lg: 'large' } },
		});
		// @ts-expect-error
		expect(comp({ size: 'sm', class: 'a', className: 'b' })).toBe('small a b');
	});

	// Base Classes
	describe('handling base classes', () => {
		it('should return base class string', () => {
			const comp = fold({ base: 'base-class' });
			expect(comp()).toBe('base-class');
		});

		it('should handle array of base classes', () => {
			const comp = fold({ base: ['base-class', 'another-class'] });
			expect(comp()).toBe('base-class another-class');
		});
	});

	// Variants & Default Variants
	describe('handling variants', () => {
		const comp = fold({
			base: 'base-class',
			variants: {
				size: { sm: 'small', lg: 'large' },
				color: { red: 'text-red', blue: 'text-blue' },
			},
			defaultVariants: { size: 'lg', color: 'blue' }
		});

		it('should apply variants correctly', () => {
			expect(comp({ size: 'sm', color: 'red' })).toBe('base-class small text-red');
		});

		it('should use default variants if not specified', () => {
			expect(comp({ color: 'red' })).toBe('base-class large text-red');
		});

		describe('handling boolean variants', () => {
			const comp = fold({
				base: 'base-class',
				variants: {
					vibe: { false: 'meh', true: 'groovy' },
					drama: { false: 'chill', true: 'meltdown' },
					fancy: { false: 'plain', true: 'fabulous' },
					mood: { false: 'neutral', true: 'unhinged' },
					binary: { false: 'zero', true: 'one' },
				},
				defaultVariants: { vibe: true, drama: false, fancy: 'true', mood: 'false' }
			});

			it('should handle boolean values', () => {
				expect(comp({ binary: true })).toMatch(/one$/)
				expect(comp({ binary: false })).toMatch(/zero$/)
			});

			it('should handle boolean string values', () => {
				expect(comp({ binary: 'true' })).toMatch(/one$/)
				expect(comp({ binary: 'false' })).toMatch(/zero$/)
			});

			it('should handle boolean / boolean string values with default', () => {
				expect(comp({})).toBe('base-class groovy chill fabulous neutral');
			});
		});
	});

	// Compound Variants
	describe('handling compound variants', () => {
		const comp = fold({
			base: 'base-class',
			variants: {
				size: { sm: 'small', lg: 'large' },
				color: { red: 'text-red', blue: 'text-blue' },
			},
			compoundVariants: [{ size: 'lg', color: 'red', class: 'text-bold' }],
		});

		it('should apply compound variants correctly', () => {
			expect(comp({ size: 'lg', color: 'red' })).toBe('base-class large text-red text-bold');
		});

		describe('handling boolean conditions', () => {
			const comp = fold({
				base: 'base-class',
				variants: {
					vibe: { false: 'meh', true: 'groovy' },
					drama: { false: 'chill', true: 'meltdown' },
					fancy: { false: 'plain', true: 'fabulous' },
					mood: { false: 'neutral', true: 'unhinged' },
					binary: { false: 'zero', true: 'one' },
				},
				compoundVariants: [
					{ vibe: 'true', drama: 'false', class: 'vibe' },
					{ vibe: 'false', drama: 'true', class: 'drama' },
					{ vibe: 'true', drama: 'true', class: 'vibe drama' },
					{ fancy: true, mood: false, class: 'fancy' },
					{ fancy: false, mood: true, class: 'mood' },
					{ fancy: true, mood: true, class: 'fancy mood' },
				],
				defaultVariants: { binary: false },
			});

			it('should apply compound variants correctly', () => {
				expect(comp({ vibe: 'true', drama: 'false' })).toMatch(/vibe/);
				expect(comp({ vibe: 'false', drama: 'true' })).toMatch(/drama/);
				expect(comp({ vibe: 'true', drama: 'true' })).toMatch(/vibe drama/);
				expect(comp({ fancy: true, mood: false })).toMatch(/fancy/);
				expect(comp({ fancy: false, mood: true })).toMatch(/mood/);
				expect(comp({ fancy: true, mood: true })).toMatch(/fancy mood/);
			});

			it('should not apply compound variants when conditions don’t match', () => {
				expect(comp({ vibe: 'false', drama: 'false' })).not.toMatch(/vibe|drama/);
				expect(comp({ fancy: false, mood: false })).not.toMatch(/fancy|mood/);
			});

			it('should apply default variants', () => {
				expect(comp({})).toMatch(/zero/); // binary: false
				expect(comp({ binary: 'true' })).toMatch(/one/);
			});
		});

		describe('handling array conditions', () => {
			const comp = fold({
				base: 'base-class',
				variants: {
					size: { sm: 'small', md: 'medium', lg: 'large' },
					color: { red: 'text-red', blue: 'text-blue' },
				},
				compoundVariants: [
					{ size: ['sm', 'md'], color: 'red', class: 'compact-red' },
				],
			});

			it('should apply compound variant when value matches an array condition', () => {
				expect(comp({ size: 'sm', color: 'red' })).toContain('compact-red');
				expect(comp({ size: 'md', color: 'red' })).toContain('compact-red');
			});

			it('should not apply compound variant when value does not match array condition', () => {
				expect(comp({ size: 'lg', color: 'red' })).not.toContain('compact-red');
			});
		});

		it('should apply compound variants using className', () => {
			const comp = fold({
				base: 'base-class',
				variants: {
					size: { sm: 'small', lg: 'large' },
					color: { red: 'text-red', blue: 'text-blue' },
				},
				compoundVariants: [{ size: 'lg', color: 'red', className: 'text-bold' }],
			});
			expect(comp({ size: 'lg', color: 'red' })).toContain('text-bold');
		});
	});

	// More Complex Variants and Default Configurations
	describe('handling complex variants', () => {
		const button = fold({
			base: 'btn',
			variants: {
				intent: {
					unset: null,
					primary: 'btn-primary',
					secondary: 'btn-secondary',
					warning: 'btn-warning',
					danger: 'btn-danger',
				},
				disabled: { unset: null, true: 'btn-disabled', false: 'btn-enabled' },
				size: { unset: null, small: 'btn-small', medium: 'btn-medium', large: 'btn-large' },
			},
			compoundVariants: [
				{ intent: 'primary', size: 'medium', class: 'btn-primary-medium uppercase' },
				{ intent: 'warning', disabled: false, class: 'btn-warning-enabled text-gray-800' },
				{ intent: 'warning', disabled: true, class: 'btn-warning-disabled text-black' },
			],
			defaultVariants: { disabled: false, intent: 'primary', size: 'medium' },
		});

		it('should return default button classes', () => {
			expect(button()).toBe('btn btn-primary btn-enabled btn-medium btn-primary-medium uppercase');
		});

		it('should handle different variants', () => {
			expect(button({ intent: 'secondary' })).toBe('btn btn-secondary btn-enabled btn-medium');
			expect(button({ size: 'small' })).toBe('btn btn-primary btn-enabled btn-small');
			expect(button({ disabled: true })).toBe('btn btn-primary btn-disabled btn-medium btn-primary-medium uppercase');
		});

		it('should handle compound variants', () => {
			expect(button({ intent: 'warning', size: 'large', disabled: true })).toBe('btn btn-warning btn-disabled btn-large btn-warning-disabled text-black');
		});

		it('should handle class merging', () => {
			expect(button({ intent: 'primary', class: 'class' })).toBe('btn btn-primary btn-enabled btn-medium btn-primary-medium uppercase class');
			expect(button({ intent: 'primary', className: 'classname' })).toBe('btn btn-primary btn-enabled btn-medium btn-primary-medium uppercase classname');
		});
	});
});

describe('fold -> fn.variantKeys', () => {
	const comp = fold({
		base: 'base-class',
		variants: {
			size: { sm: 'small', lg: 'large' },
			color: { red: 'text-red', blue: 'text-blue' },
		},
		defaultVariants: { size: 'lg', color: 'blue' }
	});

	it('should return an array of variant keys', () => {
		expect(comp.variantKeys).toEqual(['size', 'color']);
	});

	it('should return an array with correct type', () => {
		expectTypeOf(comp.variantKeys).toEqualTypeOf<Array<'size' | 'color'>>();
	});

	it('should return an empty array if no variants are defined', () => {
		const comp = fold({});
		expect(comp.variantKeys).toEqual([]);
	});
});

describe('fold -> fn.config', () => {
	const config = foldConfig({
		base: 'base-class',
		variants: {
			size: { sm: 'small', lg: 'large' },
			color: { red: 'text-red', blue: 'text-blue' },
		},
		defaultVariants: { size: 'lg', color: 'blue' }
	});

	const comp = fold(config);

	it('should return the config object', () => {
		expect(comp.config).toEqual(config);
	});

	it('should return the config object with correct type', () => {
		expectTypeOf(comp.config).toEqualTypeOf<typeof config>();
	});
});

describe('fold -> fn.partition()', () => {

	const comp = fold({
		base: 'base-class',
		variants: {
			size: { sm: 'small', lg: 'large' },
			color: { red: 'text-red', blue: 'text-blue' },
			inset: { true: 'inset', false: 'outset' },
		},
		defaultVariants: { size: 'lg', color: 'blue' }
	});

	it('should return an object with variants and otherProps', () => {
		expect(comp.partition({ size: 'sm', color: 'red', active: true })).toEqual([
			{ size: 'sm', color: 'red' },
			{ active: true },
		]);
	});

	it('should return an object with correct type', () => {
		expectTypeOf(comp.partition({ size: 'sm', inset: true, active: true })).toEqualTypeOf<[
			variants: { size: string; inset: boolean; color: unknown },
			otherProps: { active: boolean }
		]>();
	});

	it('should return empty variants and all props as otherProps when no variant keys match', () => {
		expect(comp.partition({ active: true, disabled: false })).toEqual([
			{},
			{ active: true, disabled: false },
		]);
	});

	it('should return empty tuples for an empty object', () => {
		expect(comp.partition({})).toEqual([{}, {}]);
	});
})

describe('compose -> fn()', () => {
	describe('merging components', () => {
		const box = fold({
			variants: {
				shadow: {
					sm: 'shadow-sm',
					md: 'shadow-md',
				},
			},
			defaultVariants: { shadow: 'sm' },
		});

		const stack = fold({
			variants: {
				gap: {
					unset: null,
					1: 'gap-1',
					2: 'gap-2',
					3: 'gap-3',
				},
			},
			defaultVariants: { gap: 'unset' },
		});

		const card = compose(box, stack);

		it('should return a function', () => {
			expectTypeOf(card).toBeFunction();
		});

		it('should accept correct props', () => {
			expectTypeOf(card).parameter(0).toMatchTypeOf<
				| {
						shadow?: 'sm' | 'md' | undefined;
						gap?: 'unset' | 1 | 2 | 3 | undefined;
				  }
				| undefined
			>();
		});

		it('should return default variant classes', () => {
			expect(card()).toBe('shadow-sm');
		});

		it('should handle additional `class` prop', () => {
			expect(card({ class: 'adhoc-class' })).toBe('shadow-sm adhoc-class');
		});

		it('should handle additional `className` prop', () => {
			expect(card({ className: 'adhoc-class' })).toBe('shadow-sm adhoc-class');
		});

		it('should correctly apply variant props', () => {
			expect(card({ shadow: 'md' })).toBe('shadow-md');
			expect(card({ gap: 2 })).toBe('shadow-sm gap-2');
		});

		it('should merge multiple props correctly', () => {
			expect(card({ shadow: 'md', gap: 3, class: 'adhoc-class' })).toBe(
				'shadow-md gap-3 adhoc-class'
			);
		});

		it('should merge `className` correctly with other props', () => {
			expect(card({ shadow: 'md', gap: 3, className: 'adhoc-class' })).toBe(
				'shadow-md gap-3 adhoc-class'
			);
		});
	});
});

describe('compose -> fn.variantKeys', () => {
	const box = fold({
		variants: {
			shadow: {
				sm: 'shadow-sm',
				md: 'shadow-md',
			},
		},
		defaultVariants: { shadow: 'sm' },
	});

	const stack = fold({
		variants: {
			gap: {
				unset: null,
				1: 'gap-1',
				2: 'gap-2',
				3: 'gap-3',
			},
		},
		defaultVariants: { gap: 'unset' },
	});

	const card = compose(box, stack);

	it('should return an array of variant keys', () => {
		expect(card.variantKeys).toEqual(['shadow', 'gap']);
	});

	it('should return an array with correct type', () => {
		expectTypeOf(card.variantKeys).toEqualTypeOf<Array<'shadow' | 'gap'>>();
	});

	it('should return an empty array if no variants are defined', () => {
		const comp = compose(fold({}), fold({}));
		expect(comp.variantKeys).toEqual([]);
	});

});

describe('compose -> fn.configs', () => {
	const boxConfig = foldConfig({
		base: 'base-class',
		variants: {
			shadow: { sm: 'shadow-sm', md: 'shadow-md' },
		},
		defaultVariants: { shadow: 'sm' },
	});

	const stackConfig = foldConfig({
		base: 'base-class',
		variants: { gap: { unset: null, 1: 'gap-1', 2: 'gap-2', 3: 'gap-3' } },
		defaultVariants: { gap: 'unset' },
	});

	const box = fold(boxConfig);

	const stack = fold(stackConfig);

	const card = compose(box, stack);

	it('should return an array of config objects', () => {
		expect(card.configs).toEqual([box.config, stack.config]);
	});

	it('should return an array with correct type', () => {
		type X = [typeof boxConfig, typeof stackConfig]
		expectTypeOf(card.configs).toEqualTypeOf<[typeof boxConfig, typeof stackConfig]>();
	});

	it('should return an empty array if no configs are defined', () => {
		const comp = compose(fold({}), fold({}));
		expect(comp.configs).toEqual([{}, {}]);
	});
});

describe('compose -> fn.partition()', () => {

	const box = fold({
		variants: {
			shadow: {
				sm: 'shadow-sm',
				md: 'shadow-md',
			},
			inset: {
				true: 'inset',
				false: 'outset',
			}
		},
		defaultVariants: { shadow: 'sm' },
	});

	const stack = fold({
		variants: {
			gap: {
				unset: null,
				1: 'gap-1',
				2: 'gap-2',
				3: 'gap-3',
			},
		},
		defaultVariants: { gap: 'unset' },
	});

	const card = compose(box, stack);

	it('should return an object with variants and otherProps', () => {
		expect(card.partition({ shadow: 'md', inset: true, gap: 3, active: true })).toEqual([
			{ shadow: 'md', inset: true, gap: 3 },
			{ active: true },
		]);
	});

	it('should return an object with correct type', () => {
		expectTypeOf(card.partition({ shadow: 'md', inset: true, gap: 3, active: true })).toEqualTypeOf<[
			variants: { shadow: string; inset: boolean, gap: number },
			otherProps: { active: boolean }
		]>();
	});

	it('should return empty variants and all props as otherProps when no variant keys match', () => {
		expect(card.partition({ active: true })).toEqual([
			{},
			{ active: true },
		]);
	});

	it('should return empty tuples for an empty object', () => {
		expect(card.partition({})).toEqual([{}, {}]);
	});
});

describe('defineConfig', () => {
	describe('hooks', () => {
		describe('onResolve', () => {
			const PREFIX = 'rick';
			const SUFFIX = 'rolled';

			const handleResolve = (cls: string) => [PREFIX, cls, SUFFIX].join(' ');

			// Testing the `compose` extension
			describe('extending compose', () => {
				const { compose } = defineConfig({
					hooks: { onResolve: handleResolve },
				});

				const box = fold({
					variants: { shadow: { sm: 'shadow-sm', md: 'shadow-md' } },
					defaultVariants: { shadow: 'sm' },
				});
				const stack = fold({
					variants: { gap: { unset: null, 1: 'gap-1', 2: 'gap-2', 3: 'gap-3' } },
					defaultVariants: { gap: 'unset' },
				});
				const card = compose(box, stack);

				it('should return a function', () => {
					expectTypeOf(card).toBeFunction();
				});

				it('should prepend PREFIX', () => {
					expect(card().split(' ')[0]).toBe(PREFIX);
				});

				it('should append SUFFIX', () => {
					expect(card().split(' ').at(-1)).toBe(SUFFIX);
				});

				it('should prepend PREFIX when variants are applied', () => {
					expect(card({ shadow: 'md', gap: 3 }).split(' ')[0]).toBe(PREFIX);
				});

				it('should append SUFFIX when variants are applied', () => {
					expect(card({ shadow: 'md', gap: 3 }).split(' ').at(-1)).toBe(SUFFIX);
				});
			});

			// Testing the `fold` extension
			describe('extending fold', () => {
				const { fold } = defineConfig({
					hooks: { onResolve: handleResolve },
				});

				const comp = fold({
					base: 'foo',
					variants: { intent: { primary: 'bar' } },
				});

				it('should return a function', () => {
					expectTypeOf(comp).toBeFunction();
				});

				it('should prepend PREFIX', () => {
					expect(comp({ intent: 'primary' }).split(' ')[0]).toBe(PREFIX);
				});

				it('should append SUFFIX', () => {
					expect(comp({ intent: 'primary' }).split(' ').at(-1)).toBe(SUFFIX);
				});
			});

			// Testing the `cx` extension
			describe('extending cx', () => {
				const { cx } = defineConfig({
					hooks: { onResolve: handleResolve },
				});

				it('should return a string', () => {
					expectTypeOf(cx('foo', 'bar')).toBeString();
				});

				it('should prepend PREFIX', () => {
					expect(cx('foo', 'bar').split(' ')[0]).toBe(PREFIX);
				});

				it('should append SUFFIX', () => {
					expect(cx('foo', 'bar').split(' ').at(-1)).toBe(SUFFIX);
				});
			});
		});
	});
});

describe('caching', () => {
	const recipe = foldConfig({
		base: 'base',
		variants: {
			size: { sm: 'small', lg: 'large' },
			flag: { true: 'on', false: 'off' },
		},
		compoundVariants: [
			{ size: 'lg', flag: true, class: 'big-on' },
			{ flag: ['true'], class: 'listed' },
		],
		defaultVariants: { size: 'lg', flag: false },
	});

	it('should return the same result for repeated calls', () => {
		const comp = fold(recipe);
		expect(comp({ size: 'sm' })).toBe('base small off');
		expect(comp({ size: 'sm' })).toBe('base small off');
		expect(comp()).toBe('base large off');
		expect(comp()).toBe('base large off');
	});

	it('should keep results apart for different caller classes', () => {
		const comp = fold(recipe);
		expect(comp({ size: 'sm', class: 'a' })).toBe('base small off a');
		expect(comp({ size: 'sm', class: 'b' })).toBe('base small off b');
		expect(comp({ size: 'sm', className: 'c' })).toBe('base small off c');
		expect(comp({ size: 'sm' })).toBe('base small off');
	});

	it('should accept class values that are not strings', () => {
		const comp = fold(recipe);
		expect(comp({ size: 'sm', class: ['a', { b: true, c: false }] })).toBe('base small off a b');
		expect(comp({ size: 'sm', class: ['a', { b: false, c: true }] })).toBe('base small off a c');
	});

	it('should treat a missing prop, an undefined prop and its default the same', () => {
		const comp = fold(recipe);
		expect(comp({ size: 'lg' })).toBe('base large off');
		expect(comp({ size: undefined })).toBe('base large off');
		expect(comp({})).toBe('base large off');
	});

	it('should keep values of different types apart', () => {
		const comp = fold(recipe);
		// A single-value condition compares String() forms, so 'true' and true both match it.
		// An array condition compares a truthy value as is, so only 'true' is listed.
		expect(comp({ flag: 'true' })).toBe('base large on big-on listed');
		expect(comp({ flag: true })).toBe('base large on big-on');
		expect(comp({ flag: 'true' })).toBe('base large on big-on listed');
	});

	it('should cache recipes without variants', () => {
		const comp = fold({ base: 'base' });
		expect(comp({ class: 'a' })).toBe('base a');
		expect(comp({ class: 'b' })).toBe('base b');
		expect(comp({ class: 'a' })).toBe('base a');
	});

	it('should call onResolve once for each unique input', () => {
		const onResolve = vi.fn((className: string) => `[${className}]`);
		const { fold } = defineConfig({ hooks: { onResolve } });
		const comp = fold(recipe);

		expect(comp({ size: 'sm', class: 'x' })).toBe('[base small off x]');
		expect(comp({ size: 'sm', class: 'x' })).toBe('[base small off x]');
		expect(onResolve).toHaveBeenCalledTimes(1);
		expect(onResolve).toHaveBeenLastCalledWith('base small off x');

		expect(comp({ size: 'sm', class: 'y' })).toBe('[base small off y]');
		expect(onResolve).toHaveBeenCalledTimes(2);
	});

	it('should give separate recipes separate caches', () => {
		const onResolve = vi.fn((className: string) => className);
		const { fold } = defineConfig({ hooks: { onResolve } });
		const first = fold({ base: 'first', variants: { size: { sm: 'small' } } });
		const second = fold({ base: 'second', variants: { size: { sm: 'small' } } });

		expect(first({ size: 'sm' })).toBe('first small');
		expect(second({ size: 'sm' })).toBe('second small');
		expect(onResolve).toHaveBeenCalledTimes(2);
	});

	it('should stay correct once old entries are dropped', () => {
		const onResolve = vi.fn((className: string) => className);
		const { fold } = defineConfig({ hooks: { onResolve } });
		const comp = fold(recipe);

		for (let i = 0; i < 300; i++) {
			expect(comp({ size: 'sm', class: `c${i}` })).toBe(`base small off c${i}`);
		}
		expect(onResolve).toHaveBeenCalledTimes(300);

		// The first entries were dropped, so this resolves again with the same result
		expect(comp({ size: 'sm', class: 'c0' })).toBe('base small off c0');
		expect(onResolve).toHaveBeenCalledTimes(301);
	});

	it('should call onResolve once for each unique input in compose', () => {
		const onResolve = vi.fn((className: string) => `[${className}]`);
		const { compose } = defineConfig({ hooks: { onResolve } });
		const box = fold({ variants: { shadow: { sm: 'shadow-sm', md: 'shadow-md' } }, defaultVariants: { shadow: 'sm' } });
		const stack = fold({ variants: { gap: { 1: 'gap-1', 2: 'gap-2' } } });
		const card = compose(box, stack);

		expect(card({ shadow: 'md', gap: 2 })).toBe('[shadow-md gap-2]');
		expect(card({ shadow: 'md', gap: 2 })).toBe('[shadow-md gap-2]');
		expect(onResolve).toHaveBeenCalledTimes(1);

		expect(card({ shadow: 'md', gap: 2, class: 'p-4' })).toBe('[shadow-md gap-2 p-4]');
		expect(onResolve).toHaveBeenCalledTimes(2);
	});
});
