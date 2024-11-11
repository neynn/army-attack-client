import { EventEmitter } from "../events/eventEmitter.js";
import { StateMachine } from "../state/stateMachine.js";

export const Entity = function(id = null, DEBUG_NAME = null) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.config = {};
    this.components = new Map();
    this.states = null;
    this.events = null;
}

Entity.prototype.initializeStates = function() {
    if(this.states) {
        return false;
    }

    this.states = new StateMachine(this);

    return true;
}

Entity.prototype.initializeEvents = function() {
    if(this.events) {
        return false;
    }

    this.events = new EventEmitter();

    return true;
}

Entity.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}

Entity.prototype.setConfig = function(config) {
    if(config === undefined) {
        console.warn(`EntityConfig cannot be undefined! Returning...`);
        return;
    }

    this.config = config;
} 

Entity.prototype.getConfig = function() {
    return this.config;
}

Entity.prototype.getID = function() {
    return this.id;
}

Entity.prototype.hasComponent = function(componentConstructor) {
    return this.components.has(componentConstructor);
}

Entity.prototype.addComponent = function(component) {
    this.components.set(component.constructor, component);
}

Entity.prototype.getComponent = function(componentConstructor) {
    return this.components.get(componentConstructor);
}

Entity.prototype.removeComponent = function(componentConstructor) {
    this.components.delete(componentConstructor);
}