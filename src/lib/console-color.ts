export type ConsoleColors = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'brown';

export const consoleColor = (color: ConsoleColors, ...optionalParameters: unknown[]) => {
  let fixedColor: string | undefined;
  switch (color) {
    case 'red': {
      fixedColor = '\u001B[31m%s\u001B[0m';
      break;
    }
    case 'blue': {
      fixedColor = '\u001B[34m%s\u001B[0m';
      break;
    }
    case 'green': {
      fixedColor = '\u001B[32m%s\u001B[0m';
      break;
    }
    case 'yellow': {
      fixedColor = '\u001B[33m%s\u001B[0m';
      break;
    }
    case 'purple': {
      fixedColor = '\u001B[35m%s\u001B[0m';
      break;
    }
    case 'brown': {
      fixedColor = '\u001B[33;2m%s\u001B[0m';
      break;
    }
    // No default
  }
  return console.log(fixedColor, optionalParameters.map((t) => t).join(' '));
};
