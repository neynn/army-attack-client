import { ResourceLoader } from "./source/resourceLoader.js";
import { GameContext } from "./gameContext.js";
import { ImageSheet } from "./source/graphics/imageSheet.js";
import { initializeGameContext } from "./init/initializers.js";

const gameContext = new GameContext();

//packerToJSON("clouds", await ResourceLoader.loadJSON("./clouds.json"));

ResourceLoader.loadConfigFiles("./assets", "files.json").then(async files => {
  let totalMegabytes = 0;
  let totalMegabytesLargeFiles = 0;

  await ResourceLoader.loadImages(files.sprites, ((key, image, config) => {
    const imageSheet = new ImageSheet(image, config);
    imageSheet.defineDefaultAnimation();
    const BIG = 2048 * 2048 * 4;
    const MB = 1048576;
    const imageSize = image.width * image.height * 4;
    const imageSizeMB = imageSize / MB;

    if(imageSize >= BIG) {
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
  initializeGameContext(gameContext);
  gameContext.timer.start();
  console.log(gameContext, resources);
});

//controller system, hover


//added attackAction.js
//added action_type.attack
//registered attackAction
//added targetSystem
//added fireSystem
//added healthSystem
//added armorComponent

//default move time; (96 * moveComponent.path.length) / 480;