import { ResourceManager } from "./source/resourceManager.js";
import { ArmyContext } from "./game/armyContext.js";

const gameContext = new ArmyContext();
const resourceManager = new ResourceManager();

const files = await resourceManager.promiseJSON("assets/assets.json");
const resources = await resourceManager.loadJSONList(files);

resourceManager.loadFontList(resources.fonts).then(() => {
	gameContext.loadResources(resources);
	gameContext.init(resources);
	gameContext.timer.start();
});

console.log(files, resources, gameContext, resourceManager);