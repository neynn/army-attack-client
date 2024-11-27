import { ImageSheet } from "./source/graphics/imageSheet.js";
import { ArmyContext } from "./armyContext.js";
import { GlobalResourceManager, ResourceManager } from "./source/resourceManager.js";

const gameContext = new ArmyContext();

GlobalResourceManager.setServerAddress("https://neynn.github.io/army-attack-client");

GlobalResourceManager.loadMain("assets", "assets.json").then(async files => {
  const usedMB = [];
  const usedMBLarge = [];

  await GlobalResourceManager.loadImages(files.sprites, ((key, image, config) => {
    const imageSize = image.width * image.height * 4;
    const imageSizeMB = imageSize / ResourceManager.SIZE_MB;

    if(imageSize >= ResourceManager.SIZE_BIG_IMAGE) {
      usedMBLarge.push({
        "imageID": key,
        "imageSizeMB": imageSizeMB
      });
    }

    usedMB.push({
      "imageID": key,
      "imageSizeMB": imageSizeMB
    });

    GlobalResourceManager.addSpriteSheet(key, image);
  }), (key, error, config) => console.error(key, config, error));

  console.log(usedMB, usedMBLarge);

  await GlobalResourceManager.loadImages(files.tiles,
  (key, image, config) => GlobalResourceManager.addTileSheet(key, image),
  (key, error, config) => console.error(key, config, error));

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