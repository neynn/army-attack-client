import { PlayerState } from "./playerState.js";

export const PlayerSpectateState = function() {}

PlayerSpectateState.prototype = Object.create(PlayerState.prototype);
PlayerSpectateState.prototype.constructor = PlayerSpectateState;

PlayerSpectateState.prototype.onUpdate = function(gameContext, stateMachine) {
    const player = stateMachine.getContext();
    
    player.rangeVisualizer.update(gameContext, player);
}