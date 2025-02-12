import { FactoryOwner } from "../factory/factoryOwner.js";
import { IDGenerator } from "../idGenerator.js";
import { Logger } from "../logger.js";

export const EntityManager = function() {
    FactoryOwner.call(this);

    this.traitTypes = {};
    this.idGenerator = new IDGenerator();
    this.componentTypes = new Map();
    this.entities = [];
}

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
    this.idGenerator.reset();
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

EntityManager.prototype.saveComponents = function(entity, componentIDList = []) {
    const savedComponents = {};

    for(const componentID of componentIDList) {
        const component = this.componentTypes.get(componentID);

        if(!component) {
            Logger.log(false, "Component is not registered!", "EntityManager.prototype.saveComponents", { componentID });
            continue;
        }

        const data = entity.saveComponent(component);

        if(data) {
            savedComponents[componentID] = data;
        }
    }

    return savedComponents;
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

        if(entity.hasComponent(componentType)) {
            const component = entity.getComponent(componentType);

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

            if(entity.hasComponent(componentType)) {
                const component = entity.getComponent(componentType);

                component.init(config);
            } else {
                const component = new componentType();

                component.init(config);

                entity.addComponent(component)
            }
        }
    }
}

EntityManager.prototype.getEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            return entity;
        }
    }

    return null;
}

EntityManager.prototype.createEntity = function(gameContext, config, externalID) {
    const entity = this.createProduct(gameContext, config);

    if(!entity) {
        Logger.log(false, "Factory has not returned an entity!", "EntityManager.prototype.createEntity", { config, externalID });
        return null;
    }

    const entityID = externalID || this.idGenerator.getID();

    entity.setID(entityID);
    
    this.entities.push(entity);

    return entity;
}

EntityManager.prototype.destroyEntity = function(entityID) {
    for(let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const currentID = entity.getID();

        if(currentID === entityID) {
            this.entities[i] = this.entities[this.entities.length - 1];
            this.entities.pop();

            return true;
        }
    }

    Logger.log(false, "Entity does not exist!", "EntityManager.prototype.destroyEntity", { entityID });

    return false;
}