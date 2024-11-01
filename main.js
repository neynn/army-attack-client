import { ResourceLoader } from "./source/resourceLoader.js";
import { ImageSheet } from "./source/graphics/imageSheet.js";
import { ArmyContext } from "./armyContext.js";

const gameContext = new ArmyContext();

ResourceLoader.loadConfigFiles("assets", "files.json").then(async files => {
  let totalMegabytes = 0;
  let totalMegabytesLargeFiles = 0;

  await ResourceLoader.loadImages(files.sprites, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineDefaultAnimation();

    const imageSize = image.width * image.height * 4;
    const imageSizeMB = imageSize / ResourceLoader.SIZE_MB;

    if(imageSize >= ResourceLoader.BIG_IMAGE) {
      totalMegabytesLargeFiles += imageSizeMB;
      console.log(key, imageSizeMB);
    }

    totalMegabytes += imageSizeMB;

    files.sprites[key] = imageSheet;
  }));

  console.log(totalMegabytes, totalMegabytesLargeFiles);

  await ResourceLoader.loadImages(files.tiles, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineFrames();
    imageSheet.defineAnimations();
    imageSheet.defineDefaultAnimation();
    files.tiles[key] = imageSheet;
  }));

  await ResourceLoader.loadFonts(files.fonts, (fontID, font) => document.fonts.add(font));

  return files;
}).then(async resources => {
  gameContext.loadResources(resources);
  gameContext.initializeActionQueue();
  gameContext.initializeInput();
  gameContext.initializeContext();
  gameContext.timer.start();
  console.log(gameContext, resources);
});