import { State } from "../../../../source/state/state.js";

export const PlayerSpectateState = function() {}

PlayerSpectateState.prototype = Object.create(State.prototype);
PlayerSpectateState.prototype.constructor = PlayerSpectateState;

PlayerSpectateState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    
    player.rangeVisualizer.update(gameContext, player);
}