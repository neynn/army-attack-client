export const Entity = function(id = null, DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = id;
    this.config = {};
    this.components = new Map();
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

Entity.prototype.setConfig = function(config) {
    if(config !== undefined) {
        this.config = config;
    }
} 

Entity.prototype.getConfig = function() {
    return this.config;
}

Entity.prototype.update = function(gameContext) {}