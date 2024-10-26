import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { Entity } from "./entity.js";

export const EntityManager = function() {
    this.entityTypes = {};
    this.traitTypes = {};
    this.loadableComponents = {};
    this.saveableComponents = {};
    this.IDGenerator = new IDGenerator();
    this.entities = new Map();
    this.activeEntities = new Set();
}

EntityManager.prototype.setSaveableComponents = function(saveableComponents) {
    if(typeof saveableComponents !== "object") {
        Logger.log(false, "SaveableComponents must be an object!", "EntityManager.prototype.setSaveableComponents", null);

        return false;
    }

    this.saveableComponents = saveableComponents;

    return true;
}

EntityManager.prototype.setLoadableComponents = function(loadableComponents) {
    if(typeof loadableComponents !== "object") {
        Logger.log(false, "LoadableComponents must be an object!", "EntityManager.prototype.setLoadableComponents", null);

        return false;
    }

    this.loadableComponents = loadableComponents;

    return true;
}

EntityManager.prototype.loadEntityTypes = function(entityTypes) {
    if(typeof entityTypes !== "object") {
        Logger.log(false, "EntityTypes must be an object!", "EntityManager.prototype.loadEntityTypes", null);

        return false;
    }

    this.entityTypes = entityTypes;

    return true;
}

EntityManager.prototype.loadTraitTypes = function(traitTypes) {
    if(typeof traitTypes !== "object") {
        Logger.log(false, "TraitTypes must be an object!", "EntityManager.prototype.loadTraitTypes", null);

        return false;
    }

    this.traitTypes = traitTypes;

    return true;
}

EntityManager.prototype.saveComponents = function(entity) {
    const savedComponents = {};

    for(const componentID in this.saveableComponents) {
        const ComponentType = this.saveableComponents[componentID];
        const component = entity.getComponent(ComponentType);

        if(!component) {
            continue;
        }

        if(component.save) {
            savedComponents[componentID] = component.save();
        } else {
            savedComponents[componentID] = {};

            for(const [field, value] of Object.entries(component)) {
                savedComponents[componentID][field] = value;
            }
        }
    }

    return savedComponents;
}

EntityManager.prototype.loadComponents = function(entity, savedComponents) {
    if(!savedComponents) {
        Logger.log(false, "SavedComponents cannot be undefined", "EntityManager.prototype.loadComponents", null); 

        return false; 
    }

    for(const componentID in savedComponents) {
        const componentType = this.loadableComponents[componentID];

        if(!componentType) {
            Logger.log(false, "Component is not registered as loadable!", "EntityManager.prototype.loadComponents", {componentID}); 

            continue;
        }

        const component = entity.getComponent(componentType);

        if(!component) {
            Logger.log(false, `Entity does not have component!`, "EntityManager.prototype.loadComponents", {"entityID": entity.id, componentID}); 

            continue;
        }

        const componentSetup = savedComponents[componentID];

        for(const fieldID in componentSetup) {
            if(component[fieldID] === undefined) {
                Logger.log(false, `Field does not exist on component!`, "EntityManager.prototype.loadComponents", {fieldID, componentID}); 

                continue;
            }

            component[fieldID] = componentSetup[fieldID];
        }
    }

    return true;
}

EntityManager.prototype.loadTraits = function(entity, traits) {
    for(const traitID of traits) {
        const traitType = this.traitTypes[traitID];

        if(!traitType || !traitType.components) {
            Logger.log(false, `TraitType does not exist!`, "EntityManager.prototype.loadTraits", {traitID}); 

            continue;
        }

        const { id, components, description } = traitType;
        
        for(const componentID in components) {
            const componentType = this.loadableComponents[componentID];

            if(!componentType) {
                Logger.log(false, `Component is not registered as loadable!`, "EntityManager.prototype.loadTraits", {traitID, componentID}); 

                continue;
            }

            if(!entity.hasComponent(componentType)) {
                entity.addComponent(new componentType())
            }
        }

        this.loadComponents(entity, components);
    }
}

EntityManager.prototype.overwriteID = function(entityID, forcedID) {
    const entity = this.entities.get(entityID);

    if(!entity || !forcedID) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.overwriteID", {entityID, forcedID});

        return false;
    }

    entity.setID(forcedID);
    
    this.entities.delete(entityID);
    this.entities.set(forcedID, entity);

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
        this.activeEntities.add(forcedID);
    }

    return true;
}

EntityManager.prototype.update = function(gameContext) {
    for(const entityID of this.activeEntities) {
        const entity = this.entities.get(entityID);
        entity.update(gameContext);
    }
}

EntityManager.prototype.workEnd = function() {
    this.entities.forEach(entity => this.removeEntity(entity.id));
    this.activeEntities.clear();
    this.IDGenerator.reset();
}

EntityManager.prototype.enableEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.enableEntity", {entityID});

        return false;
    }

    if(this.activeEntities.has(entityID)) {
        Logger.log(false, "Entity is already active!", "EntityManager.prototype.enableEntity", {entityID});

        return false;
    }

    this.activeEntities.add(entityID);

    return true;
}

EntityManager.prototype.disableEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.disableEntity", {entityID});

        return false;
    }

    if(!this.activeEntities.has(entityID)) {
        Logger.log(false, "Entity is not active!", "EntityManager.prototype.disableEntity", {entityID});

        return false;
    }

    this.activeEntities.delete(entityID);

    return true;
}

EntityManager.prototype.getEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist", "EntityManager.prototype.getEntity", {entityID});

        return null;
    }

    return this.entities.get(entityID);
}

EntityManager.prototype.createEntity = function(entityTypeID, externalID) {    
    const config = this.entityTypes[entityTypeID];
    const entity = new Entity(entityTypeID);
    const entityID = externalID || this.IDGenerator.getID();
   
    if(config) {
        entity.setConfig(config);
    } else {
        Logger.log(false, "EntityType does not exist", "EntityManager.prototype.createEntity", {entityID, externalID});
    }

    entity.setID(entityID);
    this.entities.set(entityID, entity)

    return entity;
}

EntityManager.prototype.removeEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.removeEntity", {entityID});

        return false;
    }

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
    }
    
    this.entities.delete(entityID);

    return true;
}

EntityManager.prototype.getEntityType = function(entityTypeID) {
    if(this.entityTypes[entityTypeID] === undefined) {
        Logger.log(false, "EntityType does not exist!", "EntityManager.prototype.getEntityType", {entityTypeID});

        return null;
    }

    return this.entityTypes[entityTypeID];
}