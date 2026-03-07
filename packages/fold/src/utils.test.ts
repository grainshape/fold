import { describe, it, expect } from 'vitest';
import { omit, pick, partition } from './utils';

describe('omit', () => {
	it('should omit specified string keys from object', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = omit(obj, 'a', 'c');
		expect(result).toEqual({ b: 2 });
	});

	it('should omit specified number keys from object', () => {
		const obj = { 1: 'one', 2: 'two', 3: 'three' };
		const result = omit(obj, 1, 3);
		expect(result).toEqual({ 2: 'two' });
	});

	it('should omit specified symbol keys from object', () => {
		const sym1 = Symbol('sym1');
		const sym2 = Symbol('sym2');
		const sym3 = Symbol('sym3');
		const obj = { [sym1]: 'value1', [sym2]: 'value2', [sym3]: 'value3' };
		const result = omit(obj, sym1, sym3);
		expect(result).toEqual({ [sym2]: 'value2' });
	});

	it('should return empty object when all keys are omitted', () => {
		const obj = { a: 1, b: 2 };
		const result = omit(obj, 'a', 'b');
		expect(result).toEqual({});
	});

	it('should return same object when no keys are omitted', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = omit(obj);
		expect(result).toEqual(obj);
	});

	it('should ignore non-existent keys', () => {
		const obj = { a: 1, b: 2 };
		const result = omit(obj, 'a', 'nonexistent' as any);
		expect(result).toEqual({ b: 2 });
	});

	it('should handle mixed key types', () => {
		const sym = Symbol('test');
		const obj = { a: 1, 2: 'two', [sym]: 'symbol' };
		const result = omit(obj, 'a', sym);
		expect(result).toEqual({ 2: 'two' });
	});

	it('should preserve property descriptors', () => {
		const obj = {};
		Object.defineProperty(obj, 'a', { value: 1, enumerable: true });
		Object.defineProperty(obj, 'b', { value: 2, enumerable: false });
		const result = omit(obj, 'a');
		expect(result).toHaveProperty('b', 2);
	});

	it('should handle empty object', () => {
		const obj = {};
		const result = omit(obj, 'a');
		expect(result).toEqual({});
	});

	it('should omit keys when provided as an array', () => {
		const obj = { a: 1, b: 2, c: 3, d: 4 };
		const result = omit(obj, ['a', 'c'] as any);
		expect(result).toEqual({ b: 2, d: 4 });
	});
});

describe('pick', () => {
	it('should pick specified string keys from object', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = pick(obj, 'a', 'c');
		expect(result).toEqual({ a: 1, c: 3 });
	});

	it('should pick specified number keys from object', () => {
		const obj = { 1: 'one', 2: 'two', 3: 'three' };
		const result = pick(obj, 1, 3);
		expect(result).toEqual({ 1: 'one', 3: 'three' });
	});

	it('should pick specified symbol keys from object', () => {
		const sym1 = Symbol('sym1');
		const sym2 = Symbol('sym2');
		const sym3 = Symbol('sym3');
		const obj = { [sym1]: 'value1', [sym2]: 'value2', [sym3]: 'value3' };
		const result = pick(obj, sym1, sym3);
		expect(result).toEqual({ [sym1]: 'value1', [sym3]: 'value3' });
	});

	it('should return empty object when no keys are picked', () => {
		const obj = { a: 1, b: 2 };
		const result = pick(obj);
		expect(result).toEqual({});
	});

	it('should return all properties when all keys are picked', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const result = pick(obj, 'a', 'b', 'c');
		expect(result).toEqual(obj);
	});

	it('should ignore non-existent keys', () => {
		const obj = { a: 1, b: 2 };
		const result = pick(obj, 'a', 'nonexistent' as any);
		expect(result).toEqual({ a: 1 });
	});

	it('should handle mixed key types', () => {
		const sym = Symbol('test');
		const obj = { a: 1, 2: 'two', [sym]: 'symbol' };
		const result = pick(obj, 'a', sym);
		expect(result).toEqual({ a: 1, [sym]: 'symbol' });
	});

	it('should preserve property descriptors', () => {
		const obj = {};
		Object.defineProperty(obj, 'a', { value: 1, enumerable: true });
		Object.defineProperty(obj, 'b', { value: 2, enumerable: false });
		const result = pick(obj, 'a', 'b');
		expect(result).toHaveProperty('a', 1);
		expect(result).toHaveProperty('b', 2);
	});

	it('should handle empty object', () => {
		const obj = {};
		const result = pick(obj, 'a');
		expect(result).toEqual({});
	});

	it('should pick keys when provided as an array', () => {
		const obj = { a: 1, b: 2, c: 3, d: 4 };
		const result = pick(obj, ['a', 'c'] as any);
		expect(result).toEqual({ a: 1, c: 3 });
	});
});

describe('partition', () => {
	it('should partition object into picked and omitted parts', () => {
		const obj = { a: 1, b: 2, c: 3, d: 4 };
		const [picked, omitted] = partition(obj, ['a', 'c']);
		expect(picked).toEqual({ a: 1, c: 3 });
		expect(omitted).toEqual({ b: 2, d: 4 });
	});

	it('should partition with string keys', () => {
		const obj = { name: 'John', age: 30, city: 'NYC', country: 'USA' };
		const [picked, omitted] = partition(obj, ['name', 'age']);
		expect(picked).toEqual({ name: 'John', age: 30 });
		expect(omitted).toEqual({ city: 'NYC', country: 'USA' });
	});

	it('should partition with number keys', () => {
		const obj = { 1: 'one', 2: 'two', 3: 'three', 4: 'four' };
		const [picked, omitted] = partition(obj, [1, 3]);
		expect(picked).toEqual({ 1: 'one', 3: 'three' });
		expect(omitted).toEqual({ 2: 'two', 4: 'four' });
	});

	it('should partition with symbol keys', () => {
		const sym1 = Symbol('sym1');
		const sym2 = Symbol('sym2');
		const sym3 = Symbol('sym3');
		const obj = { [sym1]: 'a', [sym2]: 'b', [sym3]: 'c' };
		const [picked, omitted] = partition(obj, [sym1, sym3]);
		expect(picked).toEqual({ [sym1]: 'a', [sym3]: 'c' });
		expect(omitted).toEqual({ [sym2]: 'b' });
	});

	it('should handle empty keys array', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const [picked, omitted] = partition(obj, []);
		expect(picked).toEqual({});
		expect(omitted).toEqual({ a: 1, b: 2, c: 3 });
	});

	it('should handle all keys being picked', () => {
		const obj = { a: 1, b: 2 };
		const [picked, omitted] = partition(obj, ['a', 'b']);
		expect(picked).toEqual({ a: 1, b: 2 });
		expect(omitted).toEqual({});
	});

	it('should handle empty object', () => {
		const obj = {};
		const [picked, omitted] = partition(obj, ['a', 'b']);
		expect(picked).toEqual({});
		expect(omitted).toEqual({});
	});

	it('should ignore non-existent keys', () => {
		const obj = { a: 1, b: 2 };
		const [picked, omitted] = partition(obj, ['a', 'nonexistent' as any]);
		expect(picked).toEqual({ a: 1 });
		expect(omitted).toEqual({ b: 2 });
	});

	it('should handle mixed key types', () => {
		const sym = Symbol('test');
		const obj = { a: 1, 2: 'two', [sym]: 'symbol', b: 3 };
		const [picked, omitted] = partition(obj, ['a', sym]);
		expect(picked).toEqual({ a: 1, [sym]: 'symbol' });
		expect(omitted).toEqual({ 2: 'two', b: 3 });
	});
});
