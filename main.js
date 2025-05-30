import { ResourceLoader } from "./source/resourceLoader.js";
import { ArmyContext } from "./game/armyContext.js";
import { makeProdFile, packerToJSONSprites, packerToJSONTiles, saveEntities, saveSprites2, saveSprites3 } from "./helpers.js";

const gameContext = new ArmyContext();
const resourceLoader = new ResourceLoader("assets/assets.json", "assets/assets_prod.json");
const resources = await resourceLoader.loadResources(ResourceLoader.MODE.DEVELOPER);

//saveSprites(resources.sprites);
gameContext.loadResources(resources);
gameContext.init(resources);
gameContext.timer.start();

console.log(resources, gameContext);

/*["river"].forEach(name => {
	resourceLoader.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/