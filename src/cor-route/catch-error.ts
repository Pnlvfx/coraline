export const errToString = (err: unknown, ...args: string[]) => {
  if (args) {
    args.map((value) => {
      err += ' ' + value;
    });
  }
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'description' in err) return err['description']; // TELEGRAM ERROR LIKE
  return 'API error';
};
