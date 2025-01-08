import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { Entity } from "./entity.js";

export const EntityManager = function() {
    this.componentTypes = new Map();
    this.entityTypes = {};
    this.traitTypes = {};
    this.idGenerator = new IDGenerator("@ENTITY");
    this.archetypes = new Map();
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

EntityManager.prototype.registerArchetype = function(typeID, type) {
    if(!typeID || !type) {
        Logger.log(false, "Parameter is undefined!", "EntityManager.prototype.registerArchetype", {typeID, type});
        return;
    }

    if(this.archetypes.has(typeID)) {
        Logger.log(false, "Archetype already exists!", "EntityManager.prototype.registerArchetype", {typeID});
        return;
    }

    this.archetypes.set(typeID, type);
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

EntityManager.prototype.createEntity = function(typeID, externalID) {    
    const config = this.entityTypes[typeID];
    const entityID = externalID || this.idGenerator.getID();
    const entity = new Entity(entityID, typeID);
   
    if(config) {
        entity.setConfig(config);
    } else {
        Logger.log(false, "EntityType does not exist", "EntityManager.prototype.createEntity", { typeID, entityID, externalID });
    }

    this.entities.set(entityID, entity)

    return entity;
}

EntityManager.prototype.getArchetype = function(typeID) {
    const entityType = this.entityTypes[typeID];

    if(!entityType) {
        Logger.error(false, "EntityType does not exist!", "EntityManager.prototype.getArchetype", { typeID });
        return null;
    }

    const archetypeID = entityType.archetype;
    const archetype = this.archetypes.get(archetypeID);

    if(!archetype) {
        Logger.error(false, "Archetype does not exist!", "EntityManager.prototype.getArchetype", { archetypeID, typeID });
        return null;
    }

    return archetype;
}

EntityManager.prototype.destroyEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { entityID });
        return;
    }
    
    this.entities.delete(entityID);
}