const regex = {
  upperLowerCase: (name: string) => {
    return new RegExp(`^${name}$`, 'i');
  },
  emoji: /<a?:.+?:\d{18}>|\p{Extended_Pictographic}/gu,
  flexibleMatch: (name: string) => {
    const regexString = [...name].map((char) => `${char}.*?`).join('.*?');
    return new RegExp(`^.*?${regexString}.*?$`, 'i');
  },
};

export default regex;
