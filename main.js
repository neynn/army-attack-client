import { ResourceManager } from "./source/resourceManager.js";
import { ArmyContext } from "./game/armyContext.js";
import { makeProdFile, packerToJSONSprites, packerToJSONTiles } from "./helpers.js";
import { saveSprites } from "./helpers.js";

const RESOURCE_PATH = {
	DEV: "assets/assets.json",
	PROD: "assets/assets_prod.json"
};

const gameContext = new ArmyContext();
const resourceManager = new ResourceManager();
const resources = await resourceManager.loadResources(ResourceManager.MODE.DEVELOPER, RESOURCE_PATH.DEV, RESOURCE_PATH.PROD);

//saveSprites(resources.sprites);
gameContext.loadResources(resources);
gameContext.init(resources);
gameContext.timer.start();

console.log(gameContext);

/*["river"].forEach(name => {
	resourceManager.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/