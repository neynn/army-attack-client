import { IDGenerator } from "../idGenerator.js";
import { response } from "../response.js";
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
        return response(false, "SaveableComponents must be an object!", "EntityManager.prototype.setSaveableComponents", null, null);
    }

    this.saveableComponents = saveableComponents;

    return response(true, "SaveableComponents have been loaded!", "EntityManager.prototype.setSaveableComponents", null, null);
}

EntityManager.prototype.setLoadableComponents = function(loadableComponents) {
    if(typeof loadableComponents !== "object") {
        return response(false, "LoadableComponents must be an object!", "EntityManager.prototype.setLoadableComponents", null, null);
    }

    this.loadableComponents = loadableComponents;

    return response(true, "LoadableComponents have been loaded!", "EntityManager.prototype.setLoadableComponents", null, null);
}

EntityManager.prototype.loadEntityTypes = function(entityTypes) {
    if(typeof entityTypes !== "object") {
        return response(false, "EntityTypes must be an object!", "EntityManager.prototype.loadEntityTypes", null, null);
    }

    this.entityTypes = entityTypes;

    return response(true, "EntityTypes have been loaded!", "EntityManager.prototype.loadEntityTypes", null, null);
}

EntityManager.prototype.loadTraitTypes = function(traitTypes) {
    if(typeof traitTypes !== "object") {
        return response(false, "TraitTypes must be an object!", "EntityManager.prototype.loadTraitTypes", null, null);
    }

    this.traitTypes = traitTypes;

    return response(true, "TraitTypes have been loaded!", "EntityManager.prototype.loadTraitTypes", null, null);
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
        console.warn(`SavedComponents cannot be undefined!`);
        return false; 
    }

    for(const componentID in savedComponents) {
        const componentType = this.loadableComponents[componentID];

        if(!componentType) {
            console.warn(`Component ${componentID} is not registered as loadable!`);
            continue;
        }

        const component = entity.getComponent(componentType);

        if(!component) {
            console.warn(`Entity ${entity.id} does not have component ${componentID}!`);
            continue;
        }

        const componentSetup = savedComponents[componentID];

        for(const fieldID in componentSetup) {
            if(component[fieldID] === undefined) {
                console.warn(`Field ${fieldID} does not exist on component ${componentID}!`);
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
            console.warn(`TraitType ${traitID} does not exist!`);
            continue;
        }

        const { id, components, description } = traitType;
        
        for(const componentID in components) {
            const componentType = this.loadableComponents[componentID];

            if(!componentType) {
                console.warn(`Component ${componentID} is not registered as loadable!`);
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
        console.warn(`Entity ${entityID} does not exist! Returning...`);
        return;
    }

    if(!this.activeEntities.has(entityID)) {
        this.activeEntities.add(entityID);
    }
}

EntityManager.prototype.disableEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        console.warn(`Entity ${entityID} does not exist! Returning...`);
        return;
    }

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        //response
        console.warn(`Entity ${entityID} does not exist! Returning null...`);
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
        console.warn(`EntityType ${entityTypeID} does not exist! Using empty config! Proceeding...`);
    }

    entity.setID(entityID);
    this.entities.set(entityID, entity)

    return entity;
}

EntityManager.prototype.removeEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        return response(false, "Entity does not exist!", "EntityManager.prototype.removeEntity", null, {entityID});
    }

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
    }
    
    this.entities.delete(entityID);

    return response(true, "Entity does not exist!", "EntityManager.prototype.removeEntity", null, {entityID});
}

EntityManager.prototype.getEntityType = function(entityTypeID) {
    if(this.entityTypes[entityTypeID] === undefined) {
        console.warn(`EntityType ${entityTypeID} does not exist! Returning null...`);
        return null;
    }

    return this.entityTypes[entityTypeID];
}