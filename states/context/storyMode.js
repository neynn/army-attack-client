import { CONTEXT_STATES } from "../../enums.js";
import { State } from "../../source/state/state.js";

export const StoryModeState = function() {
    State.call(this);
}

StoryModeState.prototype = Object.create(State.prototype);
StoryModeState.prototype.constructor = StoryModeState;

StoryModeState.prototype.enter = function(stateMachine) {
    this.states.setNextState(CONTEXT_STATES.STORY_MODE_PLAY);
}

StoryModeState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
}   