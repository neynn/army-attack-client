import { CONTROLLER_EVENTS } from "../../enums.js";
import { State } from "../../source/state/state.js";
import { MorphSystem } from "../../systems/morph.js";

export const UnitIdleState = function() {
    State.call(this);
}

UnitIdleState.prototype = Object.create(State.prototype);
UnitIdleState.prototype.constructor = UnitIdleState;

UnitIdleState.prototype.enter = function(stateMachine) {
    const entity = stateMachine.getContext();

    MorphSystem.updateSprite(entity, "idle");
}

UnitIdleState.prototype.onEventEnter = function(stateMachine, gameContext, eventCode) {
    if(eventCode === CONTROLLER_EVENTS.CLICK) {
        console.log("AIGHT IMMA HEAD OUT");
    }
}