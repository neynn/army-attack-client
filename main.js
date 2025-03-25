import { ResourceManager } from "./source/resourceManager.js";
import { ArmyContext } from "./game/armyContext.js";
import { packerToJSONSprites, packerToJSONTiles } from "./helpers.js";

const gameContext = new ArmyContext();
const resourceManager = new ResourceManager();


/*["river"].forEach(name => {
	resourceManager.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/

const files = await resourceManager.promiseJSON("assets/assets.json");
const resources = await resourceManager.loadJSONList(files);

resourceManager.loadFontList(resources.fonts).then(() => {
	gameContext.loadResources(resources);
	gameContext.init(resources);
	gameContext.timer.start();
});

console.log(files, resources, gameContext, resourceManager);