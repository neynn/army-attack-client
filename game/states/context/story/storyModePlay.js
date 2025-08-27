import { State } from "../../../../source/state/state.js";
import { StorySystem } from "../../../systems/story.js";

export const StoryModePlayState = function() {}

StoryModePlayState.prototype = Object.create(State.prototype);
StoryModePlayState.prototype.constructor = StoryModePlayState;

StoryModePlayState.prototype.onEnter = async function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.createUIByID("STORY_MODE", gameContext);
    StorySystem.initialize(gameContext);
}

StoryModePlayState.prototype.onExit = function(gameContext, stateMachine) {
    const { uiManager } = gameContext;

    uiManager.destroyUI("PLAY_GAME");
}