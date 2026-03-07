type Key = string | number | symbol;
/**
 * Creates a new object with specified properties omitted from the original object.
 * This function removes the specified keys from the input object and returns a new object
 * without those properties, preserving all other properties including symbol keys.
 *
 * @param obj - The source object from which to omit properties
 * @param remove - The keys to remove from the object (can be strings, numbers, symbols, or arrays)
 * @returns A new object with the specified keys omitted
 *
 * @example
 * ```typescript
 * const original = { a: 1, b: 2, c: 3 };
 * const result = omit(original, 'a', 'c');
 * // result: { b: 2 }
 * ```
 */
export function omit<Obj extends Record<Key, any>, Keys extends readonly Key[]>(
	obj: Obj,
	...remove: Keys | [Keys]
): Omit<Obj, Keys[number]> {
	const removeList = remove.flat();
	const removeStrings = removeList.map(key => String(key));
	const result = {} as Omit<Obj, Keys[number]>;

	const keys: Key[] = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];

	for (const key of keys) {
		const shouldRemove = typeof key === 'symbol'
			? removeList.includes(key as any)
			: removeStrings.includes(String(key));

		if (!shouldRemove) {
			(result as any)[key] = (obj as any)[key];
		}
	}

	return result;
}

/**
 * Creates a new object with only the specified properties from the original object.
 * This function picks the specified keys from the input object and returns a new object
 * with only those properties, preserving symbol keys if specified.
 *
 * @param obj - The source object from which to pick properties
 * @param keys - The keys to pick from the object (can be strings, numbers, symbols, or arrays)
 * @returns A new object with only the specified keys
 *
 * @example
 * ```typescript
 * const original = { a: 1, b: 2, c: 3 };
 * const result = pick(original, 'a', 'c');
 * // result: { a: 1, c: 3 }
 * ```
 */
export function pick<Obj extends Record<Key, any>, Keys extends readonly Key[]>(
	obj: Obj,
	...keys: Keys | [Keys]
): Pick<Obj, Keys[number] & keyof Obj> {
	const pickList = keys.flat();
	const pickStrings = pickList.map(key => String(key));
	const result = {} as Pick<Obj, Keys[number] & keyof Obj>;

	const allKeys: Key[] = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];

	for (const key of allKeys) {
		const shouldPick = typeof key === 'symbol'
			? pickList.includes(key as any)
			: pickStrings.includes(String(key));

		if (shouldPick) {
			(result as any)[key] = (obj as any)[key];
		}
	}

	return result;
}

/**
 * Partitions an object into two objects based on specified keys.
 * Returns a tuple where the first element contains only the specified keys,
 * and the second element contains all other keys from the original object.
 *
 * @param obj - The source object to partition
 * @param keys - The keys to extract into the first partition (can be strings, numbers, symbols, or arrays)
 * @returns A tuple [picked, omitted] where picked contains the specified keys and omitted contains the rest
 *
 * @example
 * ```typescript
 * const original = { a: 1, b: 2, c: 3, d: 4 };
 * const [selected, rest] = partition(original, 'a', 'c');
 * // selected: { a: 1, c: 3 }
 * // rest: { b: 2, d: 4 }
 * ```
 */
export function partition<Obj extends Record<Key, any>>(
	obj: Obj,
	keys: readonly Key[]
): [Record<string, any>, Record<string, any>] {
	return [pick(obj, keys as any), omit(obj, keys as any)];
}
