export type AtLeastOne<T> = [T, ...T[]];
export type ValuesOf<T> = T[keyof T];
