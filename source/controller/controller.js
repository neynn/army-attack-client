export const Controller = function() {
    this.id = null;
    this.config = {};
    this.entities = new Set();
    this.maxActions = 1;
    this.remainingActions = 1;
}

Controller.prototype.update = function(gameContext) {}

Controller.prototype.onEntityAdd = function(entityID) {}

Controller.prototype.onEntityRemove = function(entityID) {}

Controller.prototype.refreshActions = function() {
    this.remainingActions = this.maxActions;
}

Controller.prototype.setMaxActions = function(maxActions) {
    this.maxActions = maxActions;
    this.remainingActions = maxActions;
}

Controller.prototype.hasActionsLeft = function() {
    return this.remainingActions > 0;
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

Controller.prototype.makeChoice = function() {}