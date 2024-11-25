import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";
import { Entity } from "./entity.js";

export const EntityManager = function() {
    this.componentTypes = {};
    this.entityTypes = {};
    this.traitTypes = {};
    this.idGenerator = new IDGenerator("@ENTITY");
    this.archetypes = new Map();
    this.entities = new Map();
    this.activeEntities = new Set();
}

EntityManager.prototype.load = function(entityTypes, componentTypes, traitTypes) {
    if(typeof entityTypes === "object") {
        this.entityTypes = entityTypes;
    } else {
        Logger.log(false, "EntityTypes must be an object!", "EntityManager.prototype.load", null);
    }

    if(typeof componentTypes === "object") {
        this.componentTypes = componentTypes;
    } else {
        Logger.log(false, "ComponentTypes must be an object!", "EntityManager.prototype.load", null);
    }

    if(typeof traitTypes === "object") {
        this.traitTypes = traitTypes;
    } else {
        Logger.log(false, "TraitTypes must be an object!", "EntityManager.prototype.load", null);
    }
}

EntityManager.prototype.registerComponentReference = function(componentID, component) {
    if(!componentID || !componentID) {
        Logger.log(false, "Parameter is undefined!", "EntityManager.prototype.registerComponentReference", { componentID, component });
        return false;
    }

    const componentType = this.componentTypes[componentID];

    if(!componentType) {
        Logger.log(false, "ComponentType does not exist!", "EntityManager.prototype.registerComponentReference", { componentID });
        return false;
    }

    componentType.reference = component;

    return true;
}

EntityManager.prototype.update = function(gameContext) {
    for(const entityID of this.activeEntities) {
        const entity = this.entities.get(entityID);
        entity.states.update(gameContext);
    }
}

EntityManager.prototype.end = function() {
    this.entities.forEach(entity => this.destroyEntity(entity.id));
    this.activeEntities.clear();
    this.idGenerator.reset();
}

EntityManager.prototype.registerArchetype = function(typeID, type) {
    if(!typeID || !type) {
        Logger.log(false, "Parameter is undefined!", "EntityManager.prototype.registerArchetype", {typeID, type});
        return false;
    }

    if(this.archetypes.has(typeID)) {
        Logger.log(false, "Archetype already exists!", "EntityManager.prototype.registerArchetype", {typeID});
        return false;
    }

    this.archetypes.set(typeID, type);

    return true;
}

EntityManager.prototype.saveComponents = function(entity) {
    const savedComponents = {};

    for(const componentID in this.componentTypes) {
        const componentType = this.componentTypes[componentID];

        if(!componentType.save) {
            continue;
        }

        const componentConstructor = componentType.reference;
        const component = entity.getComponent(componentConstructor);

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
        const componentType = this.componentTypes[componentID];

        if(!componentType || !componentType.load) {
            Logger.log(false, "Component is not registered as loadable!", "EntityManager.prototype.loadComponents", { componentID }); 
            continue;
        }

        const componentConstructor = componentType.reference;
        const component = entity.getComponent(componentConstructor);

        if(!component) {
            Logger.log(false, `Entity does not have component!`, "EntityManager.prototype.loadComponents", { "entityID": entity.id, componentID }); 
            continue;
        }

        const componentSetup = savedComponents[componentID];

        for(const fieldID in componentSetup) {
            if(component[fieldID] === undefined) {
                Logger.log(false, `Field does not exist on component!`, "EntityManager.prototype.loadComponents", { fieldID, componentID }); 
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
            Logger.log(false, `TraitType does not exist!`, "EntityManager.prototype.loadTraits", { traitID }); 
            continue;
        }

        const { id, components, description } = traitType;
        
        for(const componentID in components) {
            const componentType = this.componentTypes[componentID];

            if(!componentType || !componentType.load) {
                Logger.log(false, `Component is not registered as loadable!`, "EntityManager.prototype.loadTraits", { traitID, componentID }); 
                continue;
            }

            const componentConstructor = componentType.reference;

            if(!componentConstructor) {
                Logger.log(false, `ComponentConstructor is not registered!`, "EntityManager.prototype.loadTraits", { traitID, componentID }); 
                continue;
            }

            if(!entity.hasComponent(componentConstructor)) {
                entity.addComponent(new componentConstructor())
            }
        }

        this.loadComponents(entity, components);
    }
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
        return null;
    }

    return this.entities.get(entityID);
}

EntityManager.prototype.createEntity = function(entityTypeID, externalID) {    
    const config = this.entityTypes[entityTypeID];
    const entityID = externalID || this.idGenerator.getID();
    const entity = new Entity(entityID, entityTypeID);
   
    if(typeof config === "object") {
        entity.setConfig(config);
    } else {
        Logger.log(false, "EntityType does not exist", "EntityManager.prototype.createEntity", {entityID, externalID});
    }


    this.entities.set(entityID, entity)

    return entity;
}

EntityManager.prototype.buildEntity = function(gameContext, entity, typeID, setup) {
    const entityType = this.entityTypes[typeID];

    if(!entityType) {
        Logger.error(false, "EntityType does not exist!", "EntityManager.prototype.buildEntity", { typeID });

        return false;
    }

    const archetypeID = entityType.archetype;
    const archetype = this.archetypes.get(archetypeID);

    if(!archetype) {
        Logger.error(false, "Archetype does not exist!", "EntityManager.prototype.buildEntity", { archetypeID, typeID });

        return false;
    }

    archetype.build(gameContext, entity, entityType, setup);

    return true;
} 

EntityManager.prototype.destroyEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", {entityID});

        return false;
    }

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
    }
    
    this.entities.delete(entityID);

    return true;
}