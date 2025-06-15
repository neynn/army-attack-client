export const Actor = function(id) {
    this.id = id;
    this.config = null;
    this.entities = new Set();
    this.maxActions = 1;
}

Actor.prototype.load = function(blob) {}

Actor.prototype.save = function() {}

Actor.prototype.update = function(gameContext) {}

Actor.prototype.onMakeChoice = function(gameContext) {}

Actor.prototype.onTurnStart = function(gameContext) {}

Actor.prototype.onTurnEnd = function(gameContext) {}

Actor.prototype.onEntityAdd = function(entity) {}

Actor.prototype.onEntityRemove = function(entity) {}

Actor.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
}

Actor.prototype.getID = function() {
    return this.id;
}

Actor.prototype.addEntity = function(entityID, entity) {
    if(!this.entities.has(entityID)) {
        this.entities.add(entityID);
        this.onEntityAdd(entity);
    }
}

Actor.prototype.removeEntity = function(entityID, entity) {
    if(this.entities.has(entityID)) {
        this.entities.delete(entityID);
        this.onEntityRemove(entity);
    }
}

Actor.prototype.hasEntity = function(entityID) {
    return this.entities.has(entityID);
}

Actor.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 