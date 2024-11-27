import { ArmyContext } from "./armyContext.js";
import { ResourceManager } from "./source/resourceManager.js";

const gameContext = new ArmyContext();
const { resourceManager } = gameContext;

resourceManager.setServerAddress("https://neynn.github.io/army-attack-client");

resourceManager.loadMain("assets", "assets.json").then(async files => {
  const usedMB = [];
  const usedMBLarge = [];

  resourceManager.loadImages(files.sprites, ((key, image, config) => {
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

    resourceManager.addSpriteSheet(key, image);
  }), (key, error, config) => console.error(key, config, error));

  console.log(usedMB, usedMBLarge);

  resourceManager.loadImages(files.tiles,
  (key, image, config) => resourceManager.addTileSheet(key, image),
  (key, error, config) => console.error(key, config, error));

  const fontPromises = [];

  for(const fontID in files.fonts) {
    const fontMeta = files.fonts[fontID];
    const fontPromise = resourceManager.loadCSSFont(fontMeta);

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