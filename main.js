import { ResourceManager } from "./source/resourceManager.js";

import { ArmyContext } from "./game/armyContext.js";

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
  gameContext.initialize();
  gameContext.start();
  console.log(resources);
});

console.log(gameContext);