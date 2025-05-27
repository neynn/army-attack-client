import { ResourceLoader } from "./source/resourceLoader.js";
import { ArmyContext } from "./game/armyContext.js";
import { makeProdFile, packerToJSONSprites, packerToJSONTiles, saveSprites2, saveSprites3 } from "./helpers.js";

const RESOURCE_PATH = {
	DEV: "assets/assets.json",
	PROD: "assets/assets_prod.json"
};

const gameContext = new ArmyContext();
const resourceLoader = new ResourceLoader();
const resources = await resourceLoader.loadResources(ResourceLoader.MODE.DEVELOPER, RESOURCE_PATH.DEV, RESOURCE_PATH.PROD);

//saveSprites(resources.sprites);
gameContext.loadResources(resources);
gameContext.init(resources);
gameContext.timer.start();

console.log(resources, gameContext);

/*["river"].forEach(name => {
	resourceLoader.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/