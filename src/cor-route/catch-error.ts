export const errToString = (err: unknown, ...args: string[]) => {
  if (args) {
    args.map((value) => {
      err += ' ' + value;
    });
  }
  if (err instanceof Error) return err.message;
  else if (typeof err === 'string') return err;
  else return 'API error';
};
