export type AtLeastOne<T> = [T, ...T[]];
export type ValuesOf<T> = T[keyof T];
export type AppendString<T extends string | number | bigint | boolean | null | undefined> = `${T}${string}`;
