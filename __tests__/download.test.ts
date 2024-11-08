import { describe, it } from '@jest/globals';
import coraline from '../src/coraline.js';

const imageUrl = 'https://res.cloudinary.com/bbabystyle/image/upload/v1724335266/ninja_art_qu3kkj.webp';
const imageUrlNoExt = 'https://res.cloudinary.com/bbabystyle/image/upload/v1724335266/ninja_art_qu3kkj';

describe('The coraline download from url', () => {
  it('Should download a png image from a url with extension', async () => {
    const output = await coraline.download(imageUrl, { directory: '.test' });
    coraline.log(output);
  });

  it('Should download a png image from a url without extension', async () => {
    const output = await coraline.download(imageUrlNoExt, { directory: '.test' });
    coraline.log(output);
  });
});
