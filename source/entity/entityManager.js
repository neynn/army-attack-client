import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";

export const EntityManager = function() {
    this.traitTypes = {};
    this.idGenerator = new IDGenerator();
    this.factoryTypes = new Map();
    this.componentTypes = new Map();
    this.entities = [];
    this.selectedFactory = null;
}

EntityManager.prototype.load = function(traitTypes) {
    if(!typeof traitTypes === "object") {
        Logger.log(false, "TraitTypes must be an object!", "EntityManager.prototype.load", null);
        return;
    }

    this.traitTypes = traitTypes;
}

EntityManager.prototype.exit = function() {
    this.entities = [];
    this.idGenerator.reset();
}

EntityManager.prototype.registerComponent = function(componentID, component) {
    if(!componentID || !componentID) {
        Logger.log(false, "Parameter is undefined!", "EntityManager.prototype.registerComponent", { componentID, component });
        return;
    }

    if(this.componentTypes.has(componentID)) {
        Logger.log(false, "Component already exists!", "EntityManager.prototype.registerComponent", { componentID, component });
        return;
    }

    this.componentTypes.set(componentID, component);
}

EntityManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];

        entity.update(gameContext);
    }
}

EntityManager.prototype.saveComponents = function(entity, componentIDList = []) {
    const savedComponents = {};

    for(const componentID of componentIDList) {
        const component = this.componentTypes.get(componentID);

        if(!component) {
            Logger.log(false, "Component is not registered!", "EntityManager.prototype.saveComponents", { componentID });
            continue;
        }

        const data = entity.saveComponent(component);

        if(!data) {
            continue;
        }

        savedComponents[componentID] = data;
    }

    return savedComponents;
}

EntityManager.prototype.loadComponents = function(entity, components = {}) {
    for(const componentID in components) {
        const component = this.componentTypes.get(componentID);
        const data = components[componentID];

        if(!component) {
            Logger.log(false, "Component is not registered!", "EntityManager.prototype.loadComponents", { componentID }); 
            continue;
        }

        entity.loadComponent(component, data);
    }
}

EntityManager.prototype.loadTraits = function(entity, traitIDList = []) {
    for(const traitID of traitIDList) {
        const traitType = this.traitTypes[traitID];

        if(!traitType) {
            Logger.log(false, "TraitType does not exist!", "EntityManager.prototype.loadTraits", { traitID }); 
            continue;
        }

        this.loadComponents(entity, traitType.components);
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            return entity;
        }
    }

    return null;
}

EntityManager.prototype.registerFactory = function(factoryID, factory) {
    this.factoryTypes.set(factoryID, factory);
}

EntityManager.prototype.selectFactory = function(factoryID) {
    if(!this.factoryTypes.has(factoryID)) {
        Logger.log(false, "Factory has not been registered!", "EntityManager.prototype.selectFactory", { factoryID });
        return;
    }

    this.selectedFactory = factoryID;
}

EntityManager.prototype.createEntity = function(gameContext, config, externalID) {
    const factory = this.factoryTypes.get(this.selectedFactory);

    if(!factory) {
        Logger.log(false, "Factory does not exist!", "EntityManager.prototype.createEntity", { "factoryID": this.selectedFactory, config, externalID });
        return null;
    }

    const entity = factory.create(gameContext, config);

    if(!entity) {
        Logger.log(false, "Factory has not returned an entity!", "EntityManager.prototype.createEntity", { "factoryID": this.selectedFactory, config, externalID });
        return null;
    }

    const entityID = externalID || this.idGenerator.getID();

    entity.setID(entityID);
    
    this.entities.push(entity);

    return entity;
}

EntityManager.prototype.destroyEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            this.entities[i] = this.entities[this.entities.length - 1];
            this.entities.pop();

            return true;
        }
    }

    Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { entityID });

    return false;
}