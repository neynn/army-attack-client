import { EventEmitter } from "../events/eventEmitter.js";
import { StateMachine } from "../state/stateMachine.js";

export const Entity = function(DEBUG_NAME) {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = null;
    this.config = {};
    this.components = new Map();
    this.states = new StateMachine(this);
    this.events = new EventEmitter();
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

Entity.prototype.setID = function(id) {
    if(id === undefined) {
        console.warn(`EntityID cannot be undefined! Returning...`);
        return false;
    }

    this.id = id;

    return true;
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