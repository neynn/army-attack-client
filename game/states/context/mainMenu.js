import { State } from "../../../source/state/state.js";
import { UIElement } from "../../../source/ui/uiElement.js";
import { ArmyContext } from "../../armyContext.js";

export const MainMenuState = function() {}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer, spriteManager } = gameContext;
    const fpsInterface = uiManager.parseUI("FPS_COUNTER", gameContext);
    const mainMenuInterface = uiManager.parseUI("MAIN_MENU", gameContext);

    fpsInterface.addDynamicText("TEXT_FPS", (element) => {
        const fps = Math.floor(renderer.fpsCounter.getSmoothFPS());
        const text = `FPS: ${fps}`;

        element.setText(text);

        if(fps >= 60) {
            element.style.color.setColorRGB(0, 255, 0);
        } else {
            element.style.color.setColorRGB(255, 0, 0);
        }
    });

    mainMenuInterface.addClick("BUTTON_PLAY", () => gameContext.switchState(ArmyContext.STATE.STORY_MODE));
    mainMenuInterface.addClick("BUTTON_EDIT", () => gameContext.switchState(ArmyContext.STATE.EDIT_MODE));
    mainMenuInterface.addClick("BUTTON_VERSUS", () => gameContext.switchState(ArmyContext.STATE.VERSUS_MODE));

    const buttonPlay = mainMenuInterface.getElement("BUTTON_PLAY");
    const buttonVersus = mainMenuInterface.getElement("BUTTON_VERSUS");
    const buttonEdit = mainMenuInterface.getElement("BUTTON_EDIT");

    const spritePlay = spriteManager.createSprite("blue_battletank_idle");
    const spriteVersus = spriteManager.createSprite("red_battletank_idle");
    const spriteEdit = spriteManager.createSprite("blue_elite_battery_idle");
    
    buttonPlay.addChild(spritePlay, "TEST");
    buttonVersus.addChild(spriteVersus, "TEST");
    buttonEdit.addChild(spriteEdit, "TEST")

    buttonPlay.events.subscribe(UIElement.EVENT.FIRST_COLLISION, "TEST", () => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_aim"));
    buttonPlay.events.subscribe(UIElement.EVENT.LAST_COLLISION, "TEST", () => spriteManager.updateSprite(spritePlay.getIndex(), "blue_battletank_idle"));

    buttonVersus.events.subscribe(UIElement.EVENT.FIRST_COLLISION, "TEST", () => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_aim"));
    buttonVersus.events.subscribe(UIElement.EVENT.LAST_COLLISION, "TEST", () => spriteManager.updateSprite(spriteVersus.getIndex(), "red_battletank_idle"));

    buttonEdit.events.subscribe(UIElement.EVENT.FIRST_COLLISION, "TEST", () => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_aim"));
    buttonEdit.events.subscribe(UIElement.EVENT.LAST_COLLISION, "TEST", () => spriteManager.updateSprite(spriteEdit.getIndex(), "blue_elite_battery_idle"));
}

MainMenuState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, spriteManager } = gameContext;

    uiManager.unparseUI("MAIN_MENU");
    spriteManager.clear();
}