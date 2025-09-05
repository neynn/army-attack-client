import { AssetLoader } from "./source/resources/assetLoader.js";
import { ArmyContext } from "./game/armyContext.js";
import { generateAnimations, generateAutoSheet, makeProdFile, packerToJSONSprites, packerToJSONTiles, saveEntities, saveSprites2, saveSprites3 } from "./helpers.js";
import { PathHandler } from "./source/resources/pathHandler.js";

const assetLoader = new AssetLoader("assets/assets.json", "assets/assets_prod.json")
const resources = await assetLoader.loadResources(AssetLoader.MODE.DEVELOPER);

//saveSprites(resources.sprites);

const gameContext = new ArmyContext();

gameContext.loadResources(resources);
gameContext.init(resources);
gameContext.timer.start();

console.log(assetLoader, gameContext);

/*["river"].forEach(name => {
	PathHandler.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/