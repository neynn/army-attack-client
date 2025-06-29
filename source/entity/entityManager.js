import { EventEmitter } from "../events/eventEmitter.js";
import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const EntityManager = function() {
    FactoryOwner.call(this);

    this.traits = {};
    this.archetypes = {};
    this.entityTypes = {};
    this.components = new Map();

    this.nextID = 0;
    this.entities = [];
    this.entityMap = new Map();
    this.pendingRemovals = [];

    this.events = new EventEmitter();
    this.events.listen(EntityManager.EVENT.ENTITY_CREATE);
    this.events.listen(EntityManager.EVENT.ENTITY_DESTROY);
}

EntityManager.EVENT = {
    ENTITY_CREATE: "ENTITY_CREATE",
    ENTITY_DESTROY: "ENTITY_DESTROY"
};

EntityManager.ID = {
    INVALID: -1
};

EntityManager.prototype = Object.create(FactoryOwner.prototype);
EntityManager.prototype.constructor = EntityManager;

EntityManager.prototype.load = function(entityTypes, traits, archetypes) {
    if(entityTypes) {
        this.entityTypes = entityTypes;
    }

    if(traits) {
        this.traits = traits;
    }

    if(archetypes) {
        this.archetypes = archetypes;
    }    
}

EntityManager.prototype.getEntityType = function(typeID) {
    const entityType = this.entityTypes[typeID];

    if(!entityType) {
        return null;
    }

    return entityType;
}

EntityManager.prototype.exit = function() {
    this.events.muteAll();
    this.entityMap.clear();
    this.entities.length = 0;
    this.pendingRemovals.length = 0;
    this.nextID = 0;
}

EntityManager.prototype.registerComponent = function(componentID, componentClass) {
    if(this.components.has(componentID)) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Component already exists!", "EntityManager.prototype.registerComponent", { "id": componentID });
        return;
    }

    this.components.set(componentID, componentClass);
}

EntityManager.prototype.forAllEntities = function(onCall) {
    for(let i = 0; i < this.entities.length; ++i) {
        const entity = this.entities[i];
        const entityID = entity.getID();

        onCall(entityID, entity);
    }
}

EntityManager.prototype.markForDestroy = function(entityID) {
    if(!this.entityMap.has(entityID)) {
        return;
    }

    this.pendingRemovals.push(entityID);
}

EntityManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.entities.length; ++i) {
        this.entities[i].update(gameContext);
    }

    for(let i = 0; i < this.pendingRemovals.length; ++i) {
        this.destroyEntity(this.pendingRemovals[i]);
    }

    this.pendingRemovals.length = 0;
}

EntityManager.prototype.getEntity = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index === undefined || index < 0 || index >= this.entities.length) {
        return null;
    }

    const entity = this.entities[index];
    const targetID = entity.getID();

    if(entityID === targetID) {
        return entity;
    }

    for(let i = 0; i < this.entities.length; ++i) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            this.entityMap.set(entityID, i);
            return entity;
        }
    }

    return null;
}

EntityManager.prototype.createEntity = function(gameContext, config, externalID) {
    const entityID = externalID !== undefined ? externalID : this.nextID++;

    if(this.entityMap.has(entityID)) {
        return null;
    }

    const entity = this.createProduct(gameContext, config);

    if(!entity) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Factory has not returned an entity!", "EntityManager.prototype.createEntity", { "id": entityID, "config": config });
        return null;
    }

    entity.setID(entityID);

    this.entityMap.set(entityID, this.entities.length);
    this.entities.push(entity);
    this.events.emit(EntityManager.EVENT.ENTITY_CREATE, entityID, entity);

    return entity;
}

EntityManager.prototype.destroyEntityAtIndex = function(index, entityID) {
    const swapEntityIndex = this.entities.length - 1;
    const swapEntity = this.entities[swapEntityIndex];
    const swapEntityID = swapEntity.getID();

    this.entityMap.set(swapEntityID, index);
    this.entityMap.delete(entityID);
    this.entities[index] = this.entities[swapEntityIndex];
    this.entities.pop();
    this.events.emit(EntityManager.EVENT.ENTITY_DESTROY, entityID);
}

EntityManager.prototype.destroyEntity = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index === undefined || index < 0 || index >= this.entities.length) {
        return;
    }

    const entity = this.entities[index];
    const targetID = entity.getID();

    if(entityID === targetID) {
        this.destroyEntityAtIndex(index, entityID);
        return;
    }
    
    for(let i = 0; i < this.entities.length; ++i) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(entityID === currentID) {
            this.destroyEntityAtIndex(i, entityID);
            return;
        }
    }
}

EntityManager.prototype.createComponentInstance = function(componentID) {
    const Component = this.components.get(componentID);

    if(!Component) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Component is not registered!", "EntityManager.prototype.addComponent", { "id": componentID }); 
        return null;
    }

    return new Component();
}

EntityManager.prototype.initComponentMap = function(entity, components) {
    for(const componentID in components) {
        if(!entity.hasComponent(componentID)) {
            const instance = this.createComponentInstance(componentID);

            if(instance) {
                entity.addComponent(componentID, instance);
            }
        }

        entity.initComponent(componentID, components[componentID]);
    }
}

EntityManager.prototype.addArchetypeComponents = function(entity, archetypeID) {
    const archetype = this.archetypes[archetypeID];

    if(!archetype || !archetype.components) {
        return;
    }

    this.initComponentMap(entity, archetype.components);
}

EntityManager.prototype.addTraitComponents = function(entity, traits) {
    for(let i = 0; i < traits.length; i++) {
        const traitID = traits[i];
        const trait = this.traits[traitID];

        if(!trait || !trait.components) {
            continue;
        }

        this.initComponentMap(entity, trait.components);
    }
}