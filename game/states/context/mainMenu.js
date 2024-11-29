import { State } from "../../../source/state/state.js";
import { UIElement } from "../../../source/ui/uiElement.js";

import { CONTEXT_STATES } from "../../enums.js";

export const MainMenuState = function() {
    State.call(this);
}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer, spriteManager } = gameContext;

    uiManager.parseUI("FPS_COUNTER", gameContext);
    uiManager.parseUI("MAIN_MENU", gameContext);

    uiManager.addTextRequest("FPS_COUNTER", "TEXT_FPS", () => `FPS: ${Math.floor(renderer.fpsCounter.getSmoothFPS())}`);

    uiManager.addClick("MAIN_MENU", "BUTTON_PLAY", () => gameContext.switchState(CONTEXT_STATES.STORY_MODE));
    uiManager.addClick("MAIN_MENU", "BUTTON_EDIT", () => gameContext.switchState(CONTEXT_STATES.EDIT_MODE));
    uiManager.addClick("MAIN_MENU", "BUTTON_VERSUS", () => gameContext.switchState(CONTEXT_STATES.VERSUS_MODE));

    const buttonPlay = uiManager.getButton("MAIN_MENU", "BUTTON_PLAY");
    const buttonVersus = uiManager.getButton("MAIN_MENU", "BUTTON_VERSUS");
    const buttonEdit = uiManager.getButton("MAIN_MENU", "BUTTON_EDIT");

    const spritePlay = spriteManager.createSprite("blue_battletank_idle");
    const spriteVersus = spriteManager.createSprite("red_battletank_idle");
    const spriteEdit = spriteManager.createSprite("blue_elite_battery_idle");
    
    buttonPlay.addChild(spritePlay, "TEST");
    buttonVersus.addChild(spriteVersus, "TEST");
    buttonEdit.addChild(spriteEdit, "TEST")

    buttonPlay.events.subscribe(UIElement.EVENT_FIRST_COLLISION, "TEST", () => spriteManager.updateSprite(spritePlay.getID(), "blue_battletank_aim"));
    buttonPlay.events.subscribe(UIElement.EVENT_FINAL_COLLISION, "TEST", () => spriteManager.updateSprite(spritePlay.getID(), "blue_battletank_idle"));

    buttonVersus.events.subscribe(UIElement.EVENT_FIRST_COLLISION, "TEST", () => spriteManager.updateSprite(spriteVersus.getID(), "red_battletank_aim"));
    buttonVersus.events.subscribe(UIElement.EVENT_FINAL_COLLISION, "TEST", () => spriteManager.updateSprite(spriteVersus.getID(), "red_battletank_idle"));

    buttonEdit.events.subscribe(UIElement.EVENT_FIRST_COLLISION, "TEST", () => spriteManager.updateSprite(spriteEdit.getID(), "blue_elite_battery_aim"));
    buttonEdit.events.subscribe(UIElement.EVENT_FINAL_COLLISION, "TEST", () => spriteManager.updateSprite(spriteEdit.getID(), "blue_elite_battery_idle"));
}

MainMenuState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager } = gameContext;

    uiManager.unparseUI("MAIN_MENU", gameContext);
}