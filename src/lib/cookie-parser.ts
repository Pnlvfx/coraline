const defaultParseOptions = {
  decodeValues: true,
  silent: false,
};

type ParseOptions = typeof defaultParseOptions;
type RoughCookie = Record<string, string | number | Date | boolean>;

export interface Cookie {
  name?: string;
  value?: string;
  expires?: Date;
  maxAge?: number;
  path?: string;
  sameSite?: 'lax';
  httpOnly?: boolean;
}

export const parseSetCookieHeader = (res: Response, options = defaultParseOptions): Cookie[] => {
  let cookieHeader: string[];
  if (typeof res.headers.getSetCookie === 'function') {
    cookieHeader = res.headers.getSetCookie();
  } else {
    const cookieStr = res.headers.get('set-cookie');
    if (!cookieStr) return [];
    cookieHeader = [cookieStr];
  }
  return cookieHeader.filter((str) => !!str.trim()).map((str) => parseString(str, options));
};

const parseString = (setCookieValue: string, options: ParseOptions): Cookie => {
  const parts = setCookieValue.split(';').filter((str) => !!str.trim());
  const nameValuePairStr = parts.shift();
  if (!nameValuePairStr) throw new Error('Error while trying to parse cookie string!');
  const parsed = parseNameValuePair(nameValuePairStr);
  const value = options.decodeValues ? decodeURIComponent(parsed.value) : parsed.value;
  const cookie: RoughCookie = {
    name: parsed.name,
    value,
  };
  parts.map((part) => {
    const sides = part.split('=');
    const key = sides.shift()?.trimStart().toLowerCase();
    const value = sides.join('=');
    if (key) {
      switch (key) {
        case 'expires': {
          cookie['expires'] = new Date(value);
          break;
        }
        case 'max-age': {
          // eslint-disable-next-line unicorn/prefer-number-properties
          cookie['maxAge'] = parseInt(value, 10);
          break;
        }
        case 'secure': {
          cookie['secure'] = true;
          break;
        }
        case 'httponly': {
          cookie['httpOnly'] = true;
          break;
        }
        case 'samesite': {
          cookie['sameSite'] = value;
          break;
        }
        default: {
          cookie[key] = value;
        }
      }
    }
  });
  return cookie;
};

const parseNameValuePair = (nameValuePairStr: string) => {
  let name = '';
  let value = '';
  const nameValueArr = nameValuePairStr.split('=');
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift() || '';
    value = nameValueArr.join('=');
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
};
