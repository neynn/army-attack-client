import { ResourceManager } from "./source/resourceManager.js";
import { ArmyContext } from "./game/armyContext.js";
import { makeProdFile, packerToJSONSprites, packerToJSONTiles } from "./helpers.js";

const mode = ResourceManager.MODE.PRODUCTION;
const gameContext = new ArmyContext();
const resourceManager = new ResourceManager();

/*["river"].forEach(name => {
	resourceManager.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/

switch(mode) {
	case ResourceManager.MODE.DEVELOPER: {
		const files = await resourceManager.promiseJSON("assets/assets.json");
		const resources = await resourceManager.loadJSONList(files);

		//makeProdFile(resources);
		resourceManager.loadFontList(resources.fonts).then(() => {
			gameContext.loadResources(resources);
			gameContext.init(resources);
			gameContext.timer.start();
		});
		break;
	}
	case ResourceManager.MODE.PRODUCTION: {
		const resources = await resourceManager.promiseJSON("assets/assets_prod.json");

		resourceManager.loadFontList(resources.fonts).then(() => {
			gameContext.loadResources(resources);
			gameContext.init(resources);
			gameContext.timer.start();
		});
		break;
	}
}

console.log(gameContext);