import { ActiveComponent } from "../component/activeComponent.js";

export const Entity = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = null;
    this.ownerID = null;
    this.config = {};
    this.components = new Map();
    this.activeComponents = [];
}

Entity.prototype.getOwner = function() {
    return this.ownerID;
}

Entity.prototype.setOwner = function(ownerID) {
    if(ownerID !== undefined) {
        this.ownerID = ownerID;
    }
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
    for(let i = 0; i < this.activeComponents.length; i++) {
        const componentID = this.activeComponents[i];
        const component = this.components.get(componentID);

        component.update(gameContext, this);
    }
}

Entity.prototype.save = function() {
    const blob = {};

    for(const [componentID, component] of this.components) {
        const data = component.save();

        if(data) {
            blob[componentID] = data;
        }
    }

    return blob;
}

Entity.prototype.hasComponent = function(component) {
    return this.components.has(component);
}

Entity.prototype.addComponent = function(componentID, component) {
    if(this.components.has(componentID)) {
        return -1;
    }

    this.components.set(componentID, component);

    if(component instanceof ActiveComponent) {
        this.activeComponents.push(componentID);
    }

    return 0;
}

Entity.prototype.getComponent = function(componentID) {
    return this.components.get(componentID);
}

Entity.prototype.removeComponent = function(componentID) {
    if(!this.components.has(componentID)) {
        return -1;
    }

    this.components.delete(componentID);

    for(let i = 0; i < this.activeComponents.length; i++) {
        const activeComponentID = this.activeComponents[i];

        if(componentID === activeComponentID) {
            this.activeComponents[i] = this.activeComponents[this.activeComponents.length - 1];
            this.activeComponents.pop();
            
            return 0;
        }
    }

    return -1;
}