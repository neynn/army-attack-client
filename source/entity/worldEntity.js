import { EventEmitter } from "../events/eventEmitter.js";
import { StateMachine } from "../state/stateMachine.js";
import { Entity } from "./entity.js";

export const WorldEntity = function(id, DEBUG_NAME) {
    Entity.call(this, id, DEBUG_NAME);
    this.config = {};
    this.states = new StateMachine(this);
    this.events = new EventEmitter();
}

WorldEntity.prototype = Object.create(Entity.prototype);
WorldEntity.prototype.constructor = WorldEntity;

WorldEntity.prototype.setConfig = function(config) {
    if(config === undefined) {
        return;
    }

    this.config = config;
} 

WorldEntity.prototype.getConfig = function() {
    return this.config;
}

WorldEntity.prototype.update = function(gameContext) {
    this.states.update(gameContext);
}