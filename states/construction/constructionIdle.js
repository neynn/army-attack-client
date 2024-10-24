import { CONTROLLER_EVENTS } from "../../enums.js";
import { State } from "../../source/state/state.js";

export const ConstructionIdleState = function() {
    State.call(this);
}

ConstructionIdleState.prototype = Object.create(State.prototype);
ConstructionIdleState.prototype.constructor = ConstructionIdleState;

ConstructionIdleState.prototype.onEventEnter = function(stateMachine, gameContext, eventCode) {
    const entity = stateMachine.getContext();

    if(eventCode === CONTROLLER_EVENTS.CLICK) {
        console.log("controller clicked on construction!")
    }
    //increase building until state is 4/4.
    //then ask if want to finish construction
    //if yes, remove the entity and place a building in its stead.
}