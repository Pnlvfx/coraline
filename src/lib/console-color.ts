export type ConsoleColors = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'brown' | 'cyan' | 'white' | 'black' | 'gray' | 'orange' | 'lila';

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
    case 'cyan': {
      fixedColor = '\u001B[36m%s\u001B[0m';
      break;
    }
    case 'white': {
      fixedColor = '\u001B[37m%s\u001B[0m';
      break;
    }
    case 'black': {
      fixedColor = '\u001B[30m%s\u001B[0m';
      break;
    }
    case 'gray': {
      fixedColor = '\u001B[90m%s\u001B[0m';
      break;
    }
    case 'orange': {
      fixedColor = '\u001B[33m%s\u001B[0m'; // Adjust the code for orange as needed
      break;
    }
    case 'lila': {
      fixedColor = '\u001B[95m%s\u001B[0m';
      break;
    }
    // No default
  }
  return console.log(fixedColor, optionalParameters.map((t) => t).join(' '));
};
