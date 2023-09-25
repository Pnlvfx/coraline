/* eslint-disable unicorn/prefer-ternary */
import path from 'node:path';
import { temporaryDirectory } from './tempy.js';
import { saveFile } from './init.js';

export const getGptCommand = async (prompt: unknown[] | string | Record<string, unknown>, maxLength = 15_000) => {
  const command = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
  const numParts = Math.ceil(command.length / maxLength);
  const fileData = [];
  const dir = temporaryDirectory();
  for (let i = 0; i < numParts; i++) {
    const start = i * maxLength;
    const end = Math.min((i + 1) * maxLength, command.length);
    let content = '';
    if (i === numParts - 1) {
      content = `[START PART ${i + 1}/${numParts}]\n${command.slice(start, end)}\n[END PART ${
        i + 1
      }/${numParts}]\nALL PARTS SENT. Now you can continue processing the request.`;
    } else {
      content = `Do not answer yet. This is just another part of the text I want to send you. Just receive and acknowledge as "Part ${
        i + 1
      }/${numParts} received" and wait for the next part.\n[START PART ${i + 1}/${numParts}]\n${command.slice(start, end)}\n[END PART ${
        i + 1
      }/${numParts}]\nRemember not answering yet. Just acknowledge you received this part with the message "Part ${
        i + 1
      }/${numParts} received" and wait for the next part.`;
    }

    const name = `split_${String(i + 1).padStart(3, '0')}_of_${String(numParts).padStart(3, '0')}.txt`;

    await saveFile(path.join(dir, name), content);

    fileData.push({
      name,
      content,
    });
  }
  console.log('The generated prompt is here:', dir);
  return fileData;
};

getGptCommand(Array.from({ length: 2000 }).map(() => ({ ciao: 'ciao', hello: 'hello', bue: 'bye' })));
