import { describe, it, expect } from 'vitest';
import { fold } from './fold';

describe('fold -> fn()', () => {

	// Base Classes
	describe('merging base classes', () => {
		it('should merge tw classes in base class string', () => {
			const comp = fold({ base: 'text-green-500 text-slate-500' });
			expect(comp()).toBe('text-slate-500');
		});

		it('should merge tw classes in array of base classes', () => {
			const comp = fold({ base: ['text-green-500', 'text-slate-500'] });
			expect(comp()).toBe('text-slate-500');
		});
	});

	// Variants & Default Variants
	describe('merging variants', () => {
		const comp = fold({
			base: 'text-slate-500',
			variants: {
				size: { sm: 'text-sm', lg: 'text-lg' },
				color: { red: 'text-red-500', blue: 'text-blue-500' },
			},
			defaultVariants: { size: 'lg', color: 'blue' }
		});

		it('should merge tw classes from variants correctly', () => {
			expect(comp({ size: 'sm', color: 'red' })).toBe('text-sm text-red-500');
		});

		it('should merge default tw classes when no variant specified', () => {
			expect(comp({ color: 'red' })).toBe('text-lg text-red-500');
		});
	});

	// Compound Variants
	describe('merging compound variants', () => {
		const comp = fold({
			base: 'text-slate-500',
			variants: {
				size: { sm: 'text-sm', lg: 'text-lg' },
				color: { red: 'text-red-500', blue: 'text-blue-500' },
			},
			compoundVariants: [{ size: 'lg', color: 'red', class: 'font-bold' }],
		});

		it('should merge compound variants correctly', () => {
			expect(comp({ size: 'lg', color: 'red' })).toBe('text-lg text-red-500 font-bold');
		});
	});
});
