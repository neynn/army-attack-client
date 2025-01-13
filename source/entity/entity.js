export const Entity = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = null;
    this.config = {};
    this.components = new Map();
}

Entity.prototype.setID = function(id) {
    if(id !== undefined) {
        this.id = id;
    }
}

Entity.prototype.getID = function() {
    return this.id;
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

Entity.prototype.loadComponent = function(type, data = {}) {
    if(!this.hasComponent(type)) {
        this.addComponent(new type());
    }

    const component = this.components.get(type);

    for(const field in data) {
        const value = data[field];

        if(component[field] !== undefined) {
            component[field] = value;
        }
    }
}

Entity.prototype.saveComponent = function(type) {
    const component = this.components.get(type);

    if(!component) {
        return null;
    }

    if(typeof component.save === "function") {
        return component.save();
    }

    const entries = Object.entries(component);
    const componentData = {};

    for(const [field, value] of entries) {
        componentData[field] = value;
    }

    return componentData;
}

Entity.prototype.hasComponent = function(component) {
    return this.components.has(component);
}

Entity.prototype.addComponent = function(component) {
    if(!this.components.has(component.constructor)) {
        this.components.set(component.constructor, component);
    }
}

Entity.prototype.getComponent = function(component) {
    return this.components.get(component);
}

Entity.prototype.removeComponent = function(component) {
    if(this.components.has(component)) {
        this.components.delete(component);
    }
}