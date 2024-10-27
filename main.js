import { ResourceLoader } from "./source/resourceLoader.js";
import { GameContext } from "./gameContext.js";
import { ImageSheet } from "./source/graphics/imageSheet.js";
import { initializeGameContext } from "./init/initializers.js";

const gameContext = new GameContext();

//packerToJSON("clouds", await ResourceLoader.loadJSON("./clouds.json"));

//instead of returning, use action.end();
//let the loader keep track of files loaded!

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
  initializeGameContext(gameContext);
  gameContext.timer.start();
  console.log(gameContext, resources);
});


//TODO: sprites do not get unparsed after their parent is deleted!
//ADD: DRAWABLE.EVENT_PARENT_REMOVED and react to that.
//controller system, hover

//added attackAction.js
//added action_type.attack
//registered attackAction
//added targetSystem
//added fireSystem
//added healthSystem
//added armorComponent

//default move time; (96 * moveComponent.path.length) / 480;
//sprite manager gets add icon / add sprite functions.
//export const log instead of response.