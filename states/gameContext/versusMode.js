import { State } from "../../source/state/state.js";

export const VersusModeState = function() {
    State.call(this);
}

VersusModeState.prototype = Object.create(State.prototype);
VersusModeState.prototype.constructor = VersusModeState;

VersusModeState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer, client } = gameContext;
    const { musicPlayer } = client;
}

VersusModeState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, client } = gameContext;
    const { musicPlayer } = client;
}