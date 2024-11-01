import { State } from "../../../source/state/state.js";

export const StoryModeIntroState = function() {
    State.call(this);
}

StoryModeIntroState.prototype = Object.create(State.prototype);
StoryModeIntroState.prototype.constructor = StoryModeIntroState;

StoryModeIntroState.prototype.enter = async function(stateMachine) {}

StoryModeIntroState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { client } = gameContext;
    const { musicPlayer } = client;
}   