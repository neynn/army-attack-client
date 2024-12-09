import { WorldEntity } from "../entity/worldEntity.js";

export const EntityController = function(id) {
    WorldEntity.call(this, id, "EntityController");
    this.entities = new Set();
}

EntityController.prototype = Object.create(WorldEntity.prototype);
EntityController.prototype.constructor = EntityController;

EntityController.prototype.removeEntity = function(entityID) {
    if(this.entities.has(entityID)) {
        this.entities.delete(entityID);
    }
}

EntityController.prototype.addEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        this.entities.add(entityID);
    }
}

EntityController.prototype.hasEntity = function(entityID) {
    return this.entities.has(entityID);
}

EntityController.prototype.onCreate = function(gameContext, payload) {}