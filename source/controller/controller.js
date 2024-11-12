import { Entity } from "../entity/entity.js";

export const Controller = function(id) {
    Entity.call(this, id, "CONTROLLER");

    this.entities = new Set();
}

Controller.prototype = Object.create(Entity.prototype);
Controller.prototype.constructor = Controller;

Controller.prototype.removeEntity = function(entityID) {
    if(this.entities.has(entityID)) {
        this.entities.delete(entityID);
    }
}

Controller.prototype.addEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        this.entities.add(entityID);
    }
}

Controller.prototype.hasEntity = function(entityID) {
    return this.entities.has(entityID);
}

Controller.prototype.initialize = function(gameContext, payload) {}