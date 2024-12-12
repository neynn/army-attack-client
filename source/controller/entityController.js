import { WorldEntity } from "../entity/worldEntity.js";

export const EntityController = function(id) {
    WorldEntity.call(this, id, "EntityController");
    this.selectedEntities = new Set();
    this.availableEntities = new Set();
}

EntityController.prototype = Object.create(WorldEntity.prototype);
EntityController.prototype.constructor = EntityController;

EntityController.prototype.getSelectedCount = function() {
    return this.selectedEntities.size;
}

EntityController.prototype.selectSingle = function(entityID) {
    if(this.availableEntities.has(entityID)) {
        this.selectedEntities.clear();
        this.selectedEntities.add(entityID);
    }
}

EntityController.prototype.getFirstSelected = function() {
    if(this.selectedEntities.size === 0) {
        return null;
    }

    const iterator = this.selectedEntities.values();
    const firstSelected = iterator.next().value;

    return firstSelected;
}

EntityController.prototype.selectEntity = function(entityID) {
    if(this.availableEntities.has(entityID)) {
        this.selectedEntities.add(entityID);
    }
}

EntityController.prototype.deselectEntity = function(entityID) {
    if(this.selectedEntities.has(entityID)) {
        this.selectedEntities.delete(entityID);
    }
}

EntityController.prototype.selectAll = function() {
    for(const entityID of this.availableEntities) {
        this.selectedEntities.add(entityID);
    }
}

EntityController.prototype.deselectAll = function() {
    this.selectedEntities.clear();
}

EntityController.prototype.removeEntity = function(entityID) {
    if(this.availableEntities.has(entityID)) {
        this.deselectEntity(entityID);
        this.availableEntities.delete(entityID);
    }
}

EntityController.prototype.addEntity = function(entityID) {
    if(!this.availableEntities.has(entityID)) {
        this.availableEntities.add(entityID);
    }
}

EntityController.prototype.hasSelected = function(entityID) {
    return this.selectedEntities.has(entityID);
}

EntityController.prototype.hasEntity = function(entityID) {
    return this.availableEntities.has(entityID);
}

EntityController.prototype.onCreate = function(gameContext, payload) {}