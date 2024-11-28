import { ArmyContext } from "./armyContext.js";

const gameContext = new ArmyContext();
const { resourceManager } = gameContext;

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