import { StateMachine } from "../../../source/state/stateMachine.js";
import { ArmyContext } from "../../armyContext.js";

import { CAMERA_TYPES, CONTEXT_STATES } from "../../enums.js";
import { StoryModeIntroState } from "./story/storyModeIntro.js";
import { StoryModePlayState } from "./story/storyModePlay.js";

export const StoryModeState = function() {
    StateMachine.call(this);
    
    this.addState(CONTEXT_STATES.STORY_MODE_INTRO, new StoryModeIntroState());
    this.addState(CONTEXT_STATES.STORY_MODE_PLAY, new StoryModePlayState());
}

StoryModeState.prototype = Object.create(StateMachine.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.onEnter = function(stateMachine) {
    const gameContext = stateMachine.getContext();

    gameContext.setGameMode(ArmyContext.GAME_MODE.STORY);
    gameContext.createCamera(CAMERA_TYPES.ARMY_CAMERA);

    this.setNextState(CONTEXT_STATES.STORY_MODE_PLAY);
}

StoryModeState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();

    gameContext.setGameMode(ArmyContext.GAME_MODE.NONE);
    gameContext.destroyCamera(CAMERA_TYPES.ARMY_CAMERA);
}