import { ActiveComponent } from "../component/activeComponent.js";

export const Entity = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = null;
    this.config = {};
    this.components = new Map();
    this.activeComponents = new Set();
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

Entity.prototype.update = function(gameContext) {
    for(const componentID of this.activeComponents) {
        const component = this.components.get(componentID);

        component.update(gameContext, this);
    }
}

Entity.prototype.save = function() {
    this.components.forEach(component => {

    });
}

Entity.prototype.saveComponent = function(type) {
    const component = this.components.get(type);

    if(!component) {
        return null;
    }

    const componentData = component.save();

    if(!componentData) {
        return null;
    }

    return componentData;
}

Entity.prototype.hasComponent = function(component) {
    return this.components.has(component);
}

Entity.prototype.addComponent = function(component) {
    if(this.components.has(component.constructor)) {
        return component;
    }

    this.components.set(component.constructor, component);

    if(component instanceof ActiveComponent) {
        this.activeComponents.add(component.constructor);
    }

    return component;
}

Entity.prototype.getComponent = function(component) {
    return this.components.get(component);
}

Entity.prototype.removeComponent = function(component) {
    if(this.components.has(component)) {
        this.components.delete(component);
    }

    if(this.activeComponents.has(component)) {
        this.activeComponents.delete(component);
    }
}