import { describe, it } from '@jest/globals';
import { download } from '../src/lib/download.js';

const imageUrl = 'https://res.cloudinary.com/bbabystyle/image/upload/v1724335266/ninja_art_qu3kkj.webp';
const imageUrlNoExt = 'https://res.cloudinary.com/bbabystyle/image/upload/v1724335266/ninja_art_qu3kkj';

describe('The coraline download from url', () => {
  it('Should download a png image from a url with extension', async () => {
    await download(imageUrl);
  });

  it('Should download a png image from a url without extension', async () => {
    await download(imageUrlNoExt);
  });
});
