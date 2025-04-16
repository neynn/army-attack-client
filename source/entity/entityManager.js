import { EventEmitter } from "../events/eventEmitter.js";
import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const EntityManager = function() {
    FactoryOwner.call(this);

    this.traits = {};
    this.archetypes = {};
    this.components = new Map();
    this.entityMap = new Map();
    this.entities = [];

    this.events = new EventEmitter();
    this.events.listen(EntityManager.EVENT.ENTITY_CREATE);
    this.events.listen(EntityManager.EVENT.ENTITY_DESTROY);
}

EntityManager.EVENT = {
    ENTITY_CREATE: "ENTITY_CREATE",
    ENTITY_DESTROY: "ENTITY_DESTROY"
};

EntityManager.NEXT_ID = 0;
EntityManager.INVALID_ID = -1;

EntityManager.prototype = Object.create(FactoryOwner.prototype);
EntityManager.prototype.constructor = EntityManager;

EntityManager.prototype.load = function(traits, archetypes) {
    if(traits) {
        this.traits = traits;
    }

    if(archetypes) {
        this.archetypes = archetypes;
    }    
}

EntityManager.prototype.exit = function() {
    this.entities = [];
    this.entityMap.clear();
}

EntityManager.prototype.removeOwner = function(actorID) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const ownerID = entity.getOwner();

        if(ownerID === actorID) {
            entity.setOwner(null);
        }
    }
}

EntityManager.prototype.registerComponent = function(componentID, component) {
    if(this.components.has(componentID)) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Component already exists!", "EntityManager.prototype.registerComponent", { "id": componentID });
        return;
    }

    this.components.set(componentID, component);
}

EntityManager.prototype.forAllEntities = function(onCall) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const entityID = entity.getID();

        onCall(entity, entityID);
    }
}

EntityManager.prototype.update = function(gameContext) {
    for(let i = 0; i < this.entities.length; i++) {
        this.entities[i].update(gameContext);
    }
}

EntityManager.prototype.loadComponents = function(entity, components) {
    for(const componentID in components) {
        const componentType = this.components.get(componentID);

        if(!componentType) {
            Logger.log(Logger.CODE.ENGINE_ERROR, "Component is not registered!", "EntityManager.prototype.loadComponents", { "id": componentID }); 
            continue;
        }

        const blob = components[componentID];

        entity.loadComponent(componentID, blob);
    }
}

EntityManager.prototype.buildComponents = function(entity, components) {
    for(const componentID in components) {
        const Type = this.components.get(componentID);

        if(!Type) {
            Logger.log(Logger.CODE.ENGINE_ERROR, "Component is not registered!", "EntityManager.prototype.buildComponents", { "id": componentID }); 
            continue;
        }

        if(!entity.hasComponent(componentID)) {
            const component = new Type();

            entity.addComponent(componentID, component);
        }

        const config = components[componentID];

        if(config) {
            const component = entity.getComponent(componentID);

            component.init(config);
        }
    }
}

EntityManager.prototype.initComponents = function(entity, archetypeID, traits) {
    const archetype = this.archetypes[archetypeID];

    if(!archetype || !archetype.components) {
        return;
    }

    this.buildComponents(entity, archetype.components);

    for(let i = 0; i < traits.length; i++) {
        const traitID = traits[i];
        const trait = this.traits[traitID];

        if(!trait || !trait.components) {
            continue;
        }

        this.buildComponents(entity, trait.components);
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index === undefined || index < 0 || index >= this.entities.length) {
        return null;
    }

    const entity = this.entities[index];
    const targetID = entity.getID();

    if(targetID === entityID) {
        return entity;
    }

    for(let i = 0; i < this.entities.length; i++) {
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
    const entity = this.createProduct(gameContext, config);

    if(!entity) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "Factory has not returned an entity!", "EntityManager.prototype.createEntity", { "id": externalID, "config": config });
        return null;
    }

    const entityID = externalID !== undefined ? externalID : EntityManager.NEXT_ID++;

    entity.setID(entityID);

    this.entityMap.set(entityID, this.entities.length);
    this.entities.push(entity);
    this.events.emit(EntityManager.EVENT.ENTITY_CREATE, entityID, entity);

    return entity;
}

EntityManager.prototype.removeEntityAtIndex = function(index, entityID) {
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
        Logger.log(Logger.CODE.ENGINE_WARN, "Index is out of bounds!", "EntityManager.prototype.destroyEntity", { "id": entityID, "index": index });
        return -1;
    }
    
    const entity = this.entities[index];
    const targetID = entity.getID();

    if(targetID === entityID) {
        this.removeEntityAtIndex(index, entityID);
        return entityID;
    }

    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            this.removeEntityAtIndex(i, entityID);
            return entityID;
        }
    }

    Logger.log(Logger.CODE.ENGINE_WARN, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { "id": entityID, "index": index });

    return -1;
}