const regex = {
  /** Match two strings using regex even if there are differences in upper or lower case */
  upperLowerCase: (name: string) => new RegExp(`^${name}$`, 'i'),
  /** Detect if a given string has emoji. */
  detectEmoji: /<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu,
  /** Remove any emoji from a given string. */
  removeEmojis: (str: string) => str.replaceAll(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, ''),
  /** Remove parentheses and the content inside it from a given string. It only detect () parenthesis. */
  removeParentheses: (str: string) => str.replaceAll(/\s*\(.*?\)\s*/g, ''),
  /** Remove any accents and tranform it to it's relative character from a given string. Example: "Nèza" will return "Neza" */
  normalizeAccents: (str: string) => str.normalize('NFD').replaceAll(/\p{Diacritic}/gu, ''),
  /** Match a string even with some differences, but note that it might be incorrect. */
  simpleMatch: (name: string) => {
    const regexString = [...name].map((char) => `${char}.*?`).join('.*?');
    return new RegExp(`^.*?${regexString}.*?$`, 'i');
  },
};

export default regex;
