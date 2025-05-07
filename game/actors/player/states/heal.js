import { State } from "../../../../source/state/state.js";

export const PlayerHealState = function() {}

PlayerHealState.prototype = Object.create(State.prototype);
PlayerHealState.prototype.constructor = PlayerHealState;

PlayerHealState.prototype.onEnter = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.rangeVisualizer.disable(gameContext);
}

PlayerHealState.prototype.onExit = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.rangeVisualizer.enable();
}
