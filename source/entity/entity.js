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

Entity.prototype.update = function(gameContext) {}

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

Entity.prototype.hasComponent = function(componentID) {
    return this.components.has(componentID);
}

Entity.prototype.addComponent = function(component) {
    if(!this.components.has(component.constructor)) {
        this.components.set(component.constructor, component);
    }
}

Entity.prototype.getComponent = function(componentID) {
    return this.components.get(componentID);
}

Entity.prototype.removeComponent = function(componentID) {
    if(this.components.has(componentID)) {
        this.components.delete(componentID);
    }
}