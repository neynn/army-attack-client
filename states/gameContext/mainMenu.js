import { CONTEXT_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";

export const MainMenuState = function() {
    State.call(this);
}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer, client, spriteManager } = gameContext;
    const { musicPlayer } = client;

    uiManager.parseUI("FPS_COUNTER", gameContext);
    uiManager.parseUI("MAIN_MENU", gameContext);

    uiManager.addTextRequest("FPS_COUNTER", "TEXT_FPS", () => `FPS: ${Math.floor(renderer.smoothedFPS)}`);
    uiManager.addClick("MAIN_MENU", "BUTTON_PLAY", () => stateMachine.setNextState(CONTEXT_STATES.STORY_MODE));
    uiManager.addClick("MAIN_MENU", "BUTTON_EDIT", () => stateMachine.setNextState(CONTEXT_STATES.EDIT_MODE));
    uiManager.addClick("MAIN_MENU", "BUTTON_PVP", () => stateMachine.setNextState(CONTEXT_STATES.VERSUS_MODE_LOBBY));

    spriteManager.addSpriteToDrawable(uiManager.getButton("MAIN_MENU", "BUTTON_PLAY"), "TANK", "blue_battletank_idle");
}

MainMenuState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, client } = gameContext;
    const { musicPlayer } = client;

    uiManager.unparseUI("MAIN_MENU", gameContext);
    //uiManager.unparseUI("FPS_COUNTER", gameContext);
}