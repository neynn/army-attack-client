import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { Entity } from "./entity.js";

export const EntityManager = function() {
    this.selectedFactory = null;
    this.factoryTypes = new Map();
    this.componentTypes = new Map();
    this.entityTypes = {};
    this.traitTypes = {};
    this.idGenerator = new IDGenerator("@ENTITY");
    this.entities = new Map();
}

EntityManager.prototype.load = function(entityTypes, traitTypes) {
    if(typeof entityTypes === "object") {
        this.entityTypes = entityTypes;
    } else {
        Logger.log(false, "EntityTypes must be an object!", "EntityManager.prototype.load", null);
    }

    if(typeof traitTypes === "object") {
        this.traitTypes = traitTypes;
    } else {
        Logger.log(false, "TraitTypes must be an object!", "EntityManager.prototype.load", null);
    }
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
    this.entities.forEach(entity => entity.update(gameContext));
}

EntityManager.prototype.end = function() {
    this.entities.forEach(entity => this.destroyEntity(entity.id));
    this.idGenerator.reset();
}

EntityManager.prototype.saveComponents = function(entity, list = []) {
    const savedComponents = {};

    for(const componentID of list) {
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

EntityManager.prototype.loadTraits = function(entity, traits = []) {
    for(const traitID of traits) {
        const traitType = this.traitTypes[traitID];

        if(!traitType) {
            Logger.log(false, `TraitType does not exist!`, "EntityManager.prototype.loadTraits", { traitID }); 
            continue;
        }

        this.loadComponents(entity, traitType.components);
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        return null;
    }

    return this.entities.get(entityID);
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
    const entity = factory.createEntity(gameContext, config);

    if(!(entity instanceof Entity)) {
        Logger.log(false, "Factory has returned an invalid type!", "EntityManager.prototype.createEntity", { config, externalID });
        return null;
    }

    const entityID = externalID || this.idGenerator.getID();
    entity.setID(entityID);
    this.entities.set(entityID, entity);

    return entity;
}

EntityManager.prototype.destroyEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { entityID });
        return;
    }
    
    this.entities.delete(entityID);
}

EntityManager.prototype.getType = function(typeID) {
    const type = this.entityTypes[typeID];

    if(!type) {
        Logger.log(false, "EntityType does not exist!", "EntityManager.prototype.getType", { typeID });
        return null;
    }

    return type;
}