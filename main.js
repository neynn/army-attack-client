import { ResourceLoader } from "./source/resourceLoader.js";
import { ArmyContext } from "./game/armyContext.js";
import { generateAnimations, generateAutoSheet, makeProdFile, packerToJSONSprites, packerToJSONTiles, saveEntities, saveSprites2, saveSprites3 } from "./helpers.js";

ResourceLoader.setPaths("assets/assets.json", "assets/assets_prod.json");

const resourceLoader = ResourceLoader.getInstance();
const resources = await resourceLoader.loadResources(ResourceLoader.MODE.DEVELOPER);

//saveSprites(resources.sprites);

const gameContext = new ArmyContext();

gameContext.loadResources(resources);
gameContext.init(resources);
gameContext.timer.start();

console.log(resourceLoader, gameContext);

/*["river"].forEach(name => {
	resourceLoader.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/