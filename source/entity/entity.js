export const Entity = function(DEBUG_NAME = "") {
    this.DEBUG_NAME = DEBUG_NAME;
    this.id = -1;
    this.config = {};
    this.components = new Map();
    this.activeComponents = [];
}

Entity.prototype.setID = function(id) {
    if(id !== undefined) {
        this.id = id;
    }
}

Entity.prototype.getID = function() {
    return this.id;
}

Entity.prototype.update = function(gameContext) {
    for(let i = 0; i < this.activeComponents.length; ++i) {
        this.activeComponents[i].update(gameContext, this);
    }
}

Entity.prototype.hasComponent = function(component) {
    return this.components.has(component);
}

Entity.prototype.getComponent = function(componentID) {
    const component = this.components.get(componentID);

    if(!component) {
        return null;
    }

    return component;
}

Entity.prototype.load = function(gameContext, blob) {}

Entity.prototype.save = function() {
    const blob = {};

    for(const [componentID, component] of this.components) {
        if(typeof component.save === "function") {
            const data = component.save();

            if(data) {
                blob[componentID] = data;
            }
        } else {
            //console.log(`Save not implemented for component ${componentID}`);
        }
    }

    return blob;
}

Entity.prototype.initComponent = function(componentID, config) {
    if(!config) {
        return;
    }

    const component = this.components.get(componentID);

    if(component && typeof component.init === "function") {
        component.init(config);
    } else {
        console.log(`Init not implemented for component ${componentID}`);
    }
}

Entity.prototype.loadComponent = function(componentID, blob) {    
    const component = this.components.get(componentID);

    if(component && typeof component.load === "function") {
        component.load(blob);
    } else {
        console.log(`Load not implemented for component ${componentID}`);
    }
}

Entity.prototype.addComponent = function(componentID, component) {
    if(this.components.has(componentID)) {
        return;
    }

    this.components.set(componentID, component);

    if(typeof component.update === "function") {
        this.activeComponents.push(component);
    }
}

Entity.prototype.removeComponent = function(componentID) {
    const component = this.components.get(componentID);

    if(!component) {
        return;
    }

    for(let i = 0; i < this.activeComponents.length; i++) {
        const activeComponent = this.activeComponents[i];

        if(activeComponent === component) {
            this.activeComponents[i] = this.activeComponents[this.activeComponents.length - 1];
            this.activeComponents.pop();
            break;
        }
    }

    this.components.delete(componentID);
}