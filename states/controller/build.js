import { State } from "../../source/state/state.js";

export const ControllerBuildState = function() {
    State.call(this);
}

ControllerBuildState.prototype = Object.create(State.prototype);
ControllerBuildState.prototype.constructor = ControllerBuildState;

ControllerBuildState.prototype.onEventEnter = function(stateMachine, gameContext, viewportTile) {
    const { mapLoader, entityManager, spriteManager } = gameContext;
    const controller = stateMachine.getContext();
    const activeMapID = mapLoader.getActiveMapID();
    const tileEntityID = viewportTile.getFirstEntity();
}