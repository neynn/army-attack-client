export const Controller = function() {
    this.id = null;
    this.config = {};
    this.entities = new Set();
    this.maxActions = 1;
}

Controller.prototype.update = function(gameContext) {}

Controller.prototype.onTurnStart = function(gameContext) {}

Controller.prototype.onTurnEnd = function(gameContext) {}

Controller.prototype.onEntityAdd = function(entityID) {}

Controller.prototype.onEntityRemove = function(entityID) {}

Controller.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
}

Controller.prototype.getID = function() {
    return this.id;
}

Controller.prototype.setID = function(id) {
    this.id = id;
}

Controller.prototype.addEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        this.entities.add(entityID);
        this.onEntityAdd(entityID);
    }
}

Controller.prototype.removeEntity = function(entityID) {
    if(this.entities.has(entityID)) {
        this.entities.delete(entityID);
        this.onEntityRemove(entityID);
    }
}

Controller.prototype.hasEntity = function(entityID) {
    return this.entities.has(entityID);
}

Controller.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 

Controller.prototype.getConfig = function() {
    return this.config;
}

Controller.prototype.makeChoice = function(gameContext) {}