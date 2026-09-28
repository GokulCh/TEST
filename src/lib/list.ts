/** Immutable helpers for editable lists of `{ id }` records. */

export const patchById = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>) =>
	list.map((item) => (item.id === id ? { ...item, ...patch } : item));

export const removeById = <T extends { id: string }>(list: T[], id: string) => list.filter((item) => item.id !== id);
