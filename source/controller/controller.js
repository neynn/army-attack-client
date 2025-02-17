export const Controller = function(id) {
    this.id = id;
    this.config = {};
    this.entities = new Set();
}

Controller.prototype.update = function(gameContext) {}

Controller.prototype.onEntityAdd = function(entityID) {}

Controller.prototype.onEntityRemove = function(entityID) {}

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

Controller.prototype.getID = function() {
    return this.id;
}

Controller.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 

Controller.prototype.getConfig = function() {
    return this.config;
}