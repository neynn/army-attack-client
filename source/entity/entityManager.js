import { EventEmitter } from "../events/eventEmitter.js";
import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";
import { Component } from "./component.js";

export const EntityManager = function() {
    FactoryOwner.call(this);

    this.nextID = 0;
    this.traits = {};
    this.archetypes = {};
    this.entityTypes = {};
    this.components = new Map();
    this.entities = new Map();
    this.pendingRemovals = new Set();
    this.activeEntities = [];

    this.events = new EventEmitter();
    this.events.listen(EntityManager.EVENT.ENTITY_CREATE);
    this.events.listen(EntityManager.EVENT.ENTITY_DESTROY);
}

EntityManager.MARK_TYPE = {
    DELETE: 0
};

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
    this.entities.clear();
    this.activeEntities.length = 0;
    this.pendingRemovals.clear();
    this.nextID = 0;
}

EntityManager.prototype.registerComponent = function(componentID, componentClass) {
    if(this.components.has(componentID)) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Component already exists!", "EntityManager.prototype.registerComponent", { "id": componentID });
        return;
    }

    const component = new Component(componentClass);

    this.components.set(componentID, component);
}

EntityManager.prototype.forAllEntities = function(onCall) {
    this.entities.forEach((entity) => {
        const entityID = entity.getID();

        onCall(entityID, entity);
    });
}

EntityManager.prototype.markEntity = function(markType, entityID) {
    if(!this.entities.has(entityID)) {
        return;
    }

    switch(markType) {
        case EntityManager.MARK_TYPE.DELETE: {
            this.pendingRemovals.add(entityID);
            break;
        }
    }
}

EntityManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.activeEntities.length; ++i) {
        this.activeEntities[i].update(gameContext);
    }

    for(const entityID of this.pendingRemovals) {
        this.destroyEntity(entityID);
    }

    this.pendingRemovals.clear();
}

EntityManager.prototype.addArchetypeComponents = function(entity, archetypeID) {
    const archetype = this.archetypes[archetypeID];

    if(!archetype || !archetype.components) {
        return;
    }

    for(const componentID in archetype.components) {
        if(!entity.hasComponent(componentID)) {
            this.addComponent(entity, componentID);
        }
        
        entity.initComponent(componentID, archetype.components[componentID]);
    }
}

EntityManager.prototype.addTraitComponents = function(entity, traits) {
    for(let i = 0; i < traits.length; i++) {
        const traitID = traits[i];
        const trait = this.traits[traitID];

        if(!trait || !trait.components) {
            continue;
        }

        for(const componentID in trait.components) {
            if(!entity.hasComponent(componentID)) {
                this.addComponent(entity, componentID);
            }
        
            entity.initComponent(componentID, trait.components[componentID]);
        }
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    const entity = this.entities.get(entityID);

    if(!entity) {
        return null;
    }

    return entity;
}

EntityManager.prototype.createEntity = function(gameContext, config, externalID) {
    const entityID = externalID !== undefined ? externalID : this.nextID++;
    const entity = this.createProduct(gameContext, config);

    if(!entity || this.entities.has(entityID)) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Factory has not returned an entity!", "EntityManager.prototype.createEntity", { "id": entityID, "config": config });
        return null;
    }

    //TODO: if creation fails and no entity is returned, then check if it was added to active entities!!!

    entity.load(gameContext, config);
    entity.setID(entityID);
    
    this.entities.set(entityID, entity);
    this.events.emit(EntityManager.EVENT.ENTITY_CREATE, entityID, entity);

    return entity;
}

EntityManager.prototype.destroyEntity = function(entityID) {
    const entity = this.entities.get(entityID);

    if(!entity) {
        return;
    }
    
    const isActive = entity.isActive();

    if(isActive) {
        this.removeActiveEntity(entity);
    }

    this.entities.delete(entityID);
    this.events.emit(EntityManager.EVENT.ENTITY_DESTROY, entityID);
}

EntityManager.prototype.addComponent = function(entity, componentID) {
    const component = this.components.get(componentID);

    if(!component) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Component is not registered!", "EntityManager.prototype.addComponent", { "id": componentID }); 
        return null;
    }

    const instance = component.createInstance();
    const isComponentActive = component.isActive();
    const wasEntityActive = entity.isActive();

    entity.addComponent(componentID, instance);

    if(isComponentActive && !wasEntityActive) {
        const isEntityActive = entity.isActive();

        if(isEntityActive) {
            this.activeEntities.push(entity);
        }
    }

    return instance;
}

EntityManager.prototype.removeActiveEntity = function(entity) {
    for(let i = 0; i < this.activeEntities.length; ++i) {
        if(this.activeEntities[i] === entity) {
            this.activeEntities[i] = this.activeEntities[this.activeEntities.length - 1];
            this.activeEntities.pop();
            return true;
        }
    }

    return false;
}