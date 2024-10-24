import { State } from "../../source/state/state.js";

export const UnitDownState = function() {
    State.call(this);
}

UnitDownState.prototype = Object.create(State.prototype);
UnitDownState.prototype.constructor = UnitDownState;

UnitDownState.prototype.onEventEnter = function(stateMachine, gameContext, eventCode) {}
