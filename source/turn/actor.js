export const Actor = function() {
    this.id = null;
    this.config = {};
    this.entities = new Set();
    this.maxActions = 1;
}

Actor.prototype.save = function() {
    return {
        "INFO": "SAVE IS NOT REGISTERED!"
    };
}

Actor.prototype.update = function(gameContext) {}

Actor.prototype.onMakeChoice = function(gameContext) {}

Actor.prototype.onTurnStart = function(gameContext) {}

Actor.prototype.onTurnEnd = function(gameContext) {}

Actor.prototype.onEntityAdd = function(entityID) {}

Actor.prototype.onEntityRemove = function(entityID) {}

Actor.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
}

Actor.prototype.getID = function() {
    return this.id;
}

Actor.prototype.setID = function(id) {
    this.id = id;
}

Actor.prototype.addEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        this.entities.add(entityID);
        this.onEntityAdd(entityID);
    }
}

Actor.prototype.removeEntity = function(entityID) {
    if(this.entities.has(entityID)) {
        this.entities.delete(entityID);
        this.onEntityRemove(entityID);
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

Actor.prototype.getConfig = function() {
    return this.config;
}