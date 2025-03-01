import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const EntityManager = function() {
    FactoryOwner.call(this);

    this.entities = [];
    this.traitTypes = {};
    this.componentTypes = new Map();
    this.entityMap = new Map();
}

EntityManager.NEXT_ID = 5;

EntityManager.prototype = Object.create(FactoryOwner.prototype);
EntityManager.prototype.constructor = EntityManager;

EntityManager.prototype.load = function(traitTypes) {
    if(!typeof traitTypes === "object") {
        Logger.log(false, "TraitTypes must be an object!", "EntityManager.prototype.load", null);
        return;
    }

    this.traitTypes = traitTypes;
}

EntityManager.prototype.exit = function() {
    this.entities = [];
    this.entityMap.clear();
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

EntityManager.prototype.loadComponents = function(entity, components) {
    if(!components) {
        return;
    }

    for(const componentID in components) {
        const blob = components[componentID];
        const componentType = this.componentTypes.get(componentID);

        if(!componentType) {
            Logger.log(false, "Component is not registered!", "EntityManager.prototype.loadComponents", { componentID }); 
            continue;
        }

        if(entity.hasComponent(componentID)) {
            const component = entity.getComponent(componentID);

            component.load(blob);
        }
    }
}

EntityManager.prototype.initTraits = function(entity, traits) {
    if(!traits) {
        return;
    }

    for(let i = 0; i < traits.length; i++) {
        const traitID = traits[i];
        const traitType = this.traitTypes[traitID];

        if(!traitType) {
            Logger.log(false, "TraitType does not exist!", "EntityManager.prototype.loadTraits", { traitID }); 
            continue;
        }

        const { components } = traitType;

        for(const componentID in components) {
            const config = components[componentID];
            const componentType = this.componentTypes.get(componentID);

            if(!componentType) {
                Logger.log(false, "Component is not registered!", "EntityManager.prototype.initTraits", { componentID }); 
                continue;
            }

            if(entity.hasComponent(componentID)) {
                const component = entity.getComponent(componentID);

                component.init(config);
            } else {
                const component = new componentType();

                component.init(config);

                entity.addComponent(componentID, component);
            }
        }
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

EntityManager.prototype.createEntity = function(gameContext, config, externalID = -1) {
    const entity = this.createProduct(gameContext, config);

    if(!entity) {
        Logger.log(false, "Factory has not returned an entity!", "EntityManager.prototype.createEntity", { config, externalID });
        return null;
    }

    const entityID = externalID !== -1 ? externalID : EntityManager.NEXT_ID++;

    entity.setID(entityID);

    this.entityMap.set(entityID, this.entities.length);    
    this.entities.push(entity);

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
}

EntityManager.prototype.destroyEntity = function(entityID) {
    const index = this.entityMap.get(entityID);

    if(index === undefined || index < 0 || index >= this.entities.length) {
        Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { entityID });

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

    Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { entityID });

    return -1;
}