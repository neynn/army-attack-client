import { State } from "../../../../source/state/state.js";

export const StoryModeIntroState = function() {}

StoryModeIntroState.prototype = Object.create(State.prototype);
StoryModeIntroState.prototype.constructor = StoryModeIntroState;

StoryModeIntroState.prototype.onEnter = async function(stateMachine) {}

StoryModeIntroState.prototype.onExit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { client } = gameContext;
    const { musicPlayer } = client;
}   