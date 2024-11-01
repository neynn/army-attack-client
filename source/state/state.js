import { StateMachine } from "./stateMachine.js";

export const State = function() {
    this.states = null;
}

State.prototype.addSubstate = function(stateID, state) {
    if(!this.states) {
        return;
    }

    this.states.addState(stateID, state);
}

State.prototype.initializeStates = function(context) {
    if(this.states) {
        return false;
    }

    this.states = new StateMachine(context);

    return true;
}

State.prototype.enter = function(stateMachine) {}

State.prototype.exit = function(stateMachine) {}

State.prototype.update = function(stateMachine, gameContext) {}

State.prototype.onEventEnter = function(stateMachine, event) {}


