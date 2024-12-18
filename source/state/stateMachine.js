import { State } from "./state.js";

export const StateMachine = function(context) {
    this.currentState = null;
    this.previousState = null;
    this.nextState = null;
    this.context = context;
    this.states = new Map();

    if(!context) {
        console.warn(`No context given to state machine!`);
    }
}

StateMachine.AUTO_ASSIGN_CONTEXT = 1;

StateMachine.prototype = Object.create(State.prototype);
StateMachine.prototype.constructor = StateMachine;

StateMachine.prototype.setContext = function(context) {
    this.context = context;
}

StateMachine.prototype.hasState = function(stateID) {
    return this.states.has(stateID);
}

StateMachine.prototype.setNextState = function(stateID) {
    const nextState = this.states.get(stateID);

    if(nextState) {
        this.nextState = nextState;
        this.goToNextState();
    } else {
        console.warn(`State (${stateID}) does not exist!`, this.context);
    }
}

StateMachine.prototype.update = function(gameContext) {
    if(this.currentState !== null) {
        this.currentState.onUpdate(this, gameContext);

        if(this.currentState.update) {
            this.currentState.update(gameContext);
        }
    }
}

StateMachine.prototype.eventEnter = function(...event) {
    if(this.currentState !== null) {
        this.currentState.onEventEnter(this, ...event);
    }
}

StateMachine.prototype.exit = function() {
    if(this.currentState !== null) {
        if(this.currentState.exit) {
            this.currentState.exit();
        }
        
        this.currentState.onExit(this);
        this.previousState = this.currentState;
    }
}

StateMachine.prototype.changeState = function(state) {
    this.exit();
    this.currentState = state;
    this.currentState.onEnter(this);
}

StateMachine.prototype.goToPreviousState = function() {
    this.changeState(this.previousState);
}

StateMachine.prototype.goToNextState = function() {
    this.changeState(this.nextState);
}

StateMachine.prototype.getContext = function() {
    return this.context;
}

StateMachine.prototype.applyContext = function(state) {
    if(state instanceof StateMachine) {
        const context = state.getContext();

        if(context === StateMachine.AUTO_ASSIGN_CONTEXT) {
            state.setContext(this.context);
        }
    }
}

StateMachine.prototype.addState = function(stateID, state) {
    if(!state) {
        console.warn(`State (${stateID}) is not defined!`);
        return;
    }

    if(this.hasState(stateID)) {
        console.warn(`State (${stateID}) already exists!`);
        return;
    }

    this.applyContext(state);
    this.states.set(stateID, state);
}

StateMachine.prototype.removeState = function(stateID) {
    if(!this.hasState(stateID)) {
        console.warn(`State (${stateID}) is not registered!`);
        return;
    }

    this.states.delete(stateID);
}

StateMachine.prototype.reset = function() {
    this.currentState = null;
    this.previousState = null;
    this.nextState = null;
}