import { ArmyContext } from "./game/armyContext.js";
import { ResourceManager } from "./source/resourceManager.js";

const gameContext = new ArmyContext();
const resourceManager = new ResourceManager();

resourceManager.loadMain("assets", "assets.json").then(async files => {
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