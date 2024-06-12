/** Use this instead of Object.entries to get typed entries. */
export const getEntries = <T extends object>(obj: T) => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};
