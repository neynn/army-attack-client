import { State } from "../../../../../source/state/state.js";

export const PlayerEmptyState = function() {}

PlayerEmptyState.prototype = Object.create(State.prototype);
PlayerEmptyState.prototype.constructor = PlayerEmptyState;

PlayerEmptyState.prototype.onEnter = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();

    player.clearAttackers();
}

PlayerEmptyState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    
    player.updateRangeIndicator(gameContext);
}