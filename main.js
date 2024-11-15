import { ResourceLoader } from "./source/resourceLoader.js";
import { ImageSheet } from "./source/graphics/imageSheet.js";
import { ArmyContext } from "./armyContext.js";
import { GlobalResourceManager } from "./source/resourceManager.js";

const gameContext = new ArmyContext();

GlobalResourceManager.setServerAddress("https://neynn.github.io/army-attack-client");

GlobalResourceManager.loadMain("assets", "files.json").then(async files => {
  const usedMB = [];
  const usedMBLarge = [];

  await ResourceLoader.loadImages(files.sprites, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineDefaultAnimation();

    const imageSize = image.width * image.height * 4;
    const imageSizeMB = imageSize / ResourceLoader.SIZE_MB;

    if(imageSize >= ResourceLoader.BIG_IMAGE) {
      usedMBLarge.push({
        "imageID": key,
        "imageSizeMB": imageSizeMB
      });
    }

    usedMB.push({
      "imageID": key,
      "imageSizeMB": imageSizeMB
    });

    files.sprites[key] = imageSheet;
  }));

  console.log(usedMB, usedMBLarge);

  await ResourceLoader.loadImages(files.tiles, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineFrames();
    imageSheet.defineAnimations();
    imageSheet.defineDefaultAnimation();
    files.tiles[key] = imageSheet;
  }));

  const fontPromises = [];

  for(const fontID in files.fonts) {
    const fontMeta = files.fonts[fontID];
    const fontPromise = GlobalResourceManager.loadCSSFont(fontMeta);

    fontPromises.push(fontPromise);
  }

  await Promise.allSettled(fontPromises);

  return files;
}).then(resources => {
  gameContext.loadResources(resources);
  gameContext.addUIClickEvent();
  gameContext.initialize();
  gameContext.timer.start();
  console.log(resources);
});

console.log(gameContext);
console.log(GlobalResourceManager);