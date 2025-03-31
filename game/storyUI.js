import { UIManager } from "../source/ui/uiManager.js";
import { UserInterface } from "../source/ui/userInterface.js";
import { ArmyActorFactory } from "./init/armyActorFactory.js";

export const createStoryModeUI = function(gameContext) {
    const { world, uiManager } = gameContext;
    const { turnManager } = world;

    /*
    const player = turnManager.getActor(ArmyActorFactory.TYPE.PLAYER);
    const ui = new UserInterface("STORY_MODE_UI");

    const containerInfo = ui.constructElement("infoc", UIManager.ELEMENT_TYPE.CONTAINER, {
        position: { x: 0, y: 0 },
        width: 50,
        height: 50
    });

    const textMoney = ui.constructElement("textm", UIManager.ELEMENT_TYPE.TEXT, {
        position: { x: 0, y: 25 },
        fontSize: 10,
        text: "MONEY"
    });

    ui.linkElements("infoc", ["textm"]);
    ui.rootElement(gameContext, "infoc");

    uiManager.addUI(ui);
    */
}