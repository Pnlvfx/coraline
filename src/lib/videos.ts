const splitId = (public_id: string) => {
  const collection = public_id.split('/');
  if (collection.length !== 2) throw new Error('Invalid public_id');
  return { collection: collection[0], id: collection[1] };
};

const coralineVideos = {
  splitId,
  // saveVideo: async (public_id: string, file: string, width: number, height: number) => {
  //   const data = splitId(public_id);
  //   if (!data) throw new Error(`No data found`);
  //   const collection = coraline.use(`/static/videos/${data.collection}`);
  //   const filename = `${collection}/${data.id}.mp4`;
  //   const isUrl = coraline.isUrl(file);
  //   if (isUrl) {
  //     https.get(file, (res) => {
  //       const fileStream = fs.createWriteStream(filename);
  //       res.pipe(fileStream);
  //       fileStream.on('error', (err) => {
  //         throw new Error(err.message);
  //       });
  //       fileStream.on('finish', () => {
  //         fileStream.close();
  //       });
  //     });
  //   } else {
  //     const buffer = Buffer.from(file.split(',')[1], 'base64');
  //     await coraline.saveFile(filename, buffer);
  //   }
  //   const url = coraline.media.videos.buildUrl(data.collection, data.id);
  //   const video = {
  //     url,
  //     folder: data.collection,
  //     format: 'mp4',
  //     created_at: new Date().toISOString(),
  //     version: 1,
  //     public_id,
  //     resource_type: 'video',
  //     width,
  //     height,
  //   };
  //   return video as VideoProps;
  // },
};

export default coralineVideos;
