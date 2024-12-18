import { State } from "../../../source/state/state.js";

export const ControllerBuildState = function() {}

ControllerBuildState.prototype = Object.create(State.prototype);
ControllerBuildState.prototype.constructor = ControllerBuildState;

ControllerBuildState.prototype.onEventEnter = function(stateMachine, gameContext) {}