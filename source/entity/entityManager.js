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

EntityManager.prototype.registerComponent = function(componentID, component) {
    if(!componentID || !componentID) {
        Logger.log(false, "Parameter is undefined!", "EntityManager.prototype.registerComponent", { componentID, component });
        return;
    }

    const componentType = this.componentTypes[componentID];

    if(!componentType) {
        Logger.log(false, "ComponentType does not exist!", "EntityManager.prototype.registerComponent", { componentID });
        return;
    }

    componentType.reference = component;
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
        return;
    }

    if(this.archetypes.has(typeID)) {
        Logger.log(false, "Archetype already exists!", "EntityManager.prototype.registerArchetype", {typeID});
        return;
    }

    this.archetypes.set(typeID, type);
}

EntityManager.prototype.saveComponents = function(entity) {
    const savedComponents = {};

    for(const componentID in this.componentTypes) {
        const componentType = this.componentTypes[componentID];

        if(!componentType.allowSave) {
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

EntityManager.prototype.loadComponentFields = function(component, fields = {}) {
    for(const fieldID in fields) {
        if(component[fieldID] === undefined) {
            Logger.log(false, `Field does not exist on component!`, "EntityManager.prototype.loadComponent", { fieldID }); 
            continue;
        }

        component[fieldID] = fields[fieldID];
    }
}

EntityManager.prototype.loadCustomComponents = function(entity, customComponents = {}) {
    for(const componentID in customComponents) {
        const componentType = this.componentTypes[componentID];
        const componentFields = customComponents[componentID];

        if(!componentType) {
            Logger.log(false, "Component is not registered as customizeable!", "EntityManager.prototype.loadCustomComponents", { componentID }); 
            continue;
        }

        const componentConstructor = componentType.reference;
        const entityComponent = entity.getComponent(componentConstructor);

        if(!entityComponent) {
            Logger.log(false, `Entity does not have component!`, "EntityManager.prototype.loadCustomComponents", { "entityID": entity.id, componentID }); 
            continue;
        }

        this.loadComponentFields(entityComponent, componentFields);
    }
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
            const componentFields = components[componentID];

            if(!componentType || !componentType.allowTrait || !componentType.reference) {
                Logger.log(false, `Component is not registered as loadable!`, "EntityManager.prototype.loadTraits", { traitID, componentID }); 
                continue;
            }

            const componentConstructor = componentType.reference;
            const entityComponent = entity.getComponent(componentConstructor);

            if(!entityComponent) {
                const component = new componentConstructor();
                this.loadComponentFields(component, componentFields);
                entity.addComponent(component);
            } else {
                this.loadComponentFields(entityComponent, componentFields);
            }
        }
    }
}

EntityManager.prototype.enableEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.enableEntity", {entityID});
        return;
    }

    if(this.activeEntities.has(entityID)) {
        Logger.log(false, "Entity is already active!", "EntityManager.prototype.enableEntity", {entityID});
        return;
    }

    this.activeEntities.add(entityID);
}

EntityManager.prototype.disableEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.disableEntity", {entityID});
        return;
    }

    if(!this.activeEntities.has(entityID)) {
        Logger.log(false, "Entity is not active!", "EntityManager.prototype.disableEntity", {entityID});
        return;
    }

    this.activeEntities.delete(entityID);
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
        return;
    }

    const archetypeID = entityType.archetype;
    const archetype = this.archetypes.get(archetypeID);

    if(!archetype) {
        Logger.error(false, "Archetype does not exist!", "EntityManager.prototype.buildEntity", { archetypeID, typeID });
        return;
    }

    archetype.build(gameContext, entity, entityType, setup);
} 

EntityManager.prototype.destroyEntity = function(entityID) {
    if(!this.entities.has(entityID)) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", {entityID});
        return;
    }

    if(this.activeEntities.has(entityID)) {
        this.activeEntities.delete(entityID);
    }
    
    this.entities.delete(entityID);
}