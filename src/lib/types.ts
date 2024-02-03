type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>;

/** Check if it's a valid number from range of numbers. */
export type Range<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

export type Callback<T> = (() => Promise<T>) | (() => T);

/** Use this to prettify your types. */
export type Prettify<T> = {
  [K in keyof T]: T[K];
  // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

type ValueOf<T> = T[keyof T];
type Entries<T> = [keyof T, ValueOf<T>][];

/** Use this instead of Object.entries to get typed entries. */
export const getEntries = <T extends object>(obj: T) => {
  return Object.entries(obj) as Prettify<Entries<T>>;
};
