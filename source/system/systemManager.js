import { Logger } from "../logger.js";

export const SystemManager = function() {
    this.config = {};
    this.systems = new Map();
}

SystemManager.prototype.update = function(gameContext) {
    const { entityManager } = gameContext;
    
    for(const [systemID, system] of this.systems) {
        const { entities, reference } = system;
        const invalidIDs = [];

        for(const entityID of entities) {
            const entity = entityManager.getEntity(entityID);

            if(!entity) {
                invalidIDs.push(entityID);
                continue;
            }

            reference.update(gameContext, entity);
        }

        for(const entityID of invalidIDs) {
            Logger.log(false, "Entity no longer exists!", "SystemManager.prototype.update", {entityID});

            entities.delete(entityID);
        }
    }
}

SystemManager.prototype.registerSystem = function(systemID, system) {
    if(this.systems.has(systemID)) {
        Logger.log(false, "System already exists!", "SystemManager.prototype.registerSystem", {systemID});

        return false;
    }

    if(typeof system !== "function" || !system.hasOwnProperty("update")) {
        Logger.log(false, "System is invalid!", "SystemManager.prototype.registerSystem", {systemID});

        return false;
    }

    this.systems.set(systemID, {
        "reference": system,
        "entities": new Set()
    });

    return true;
}

SystemManager.prototype.addEntity = function(systemID, entityID) {
    const system = this.systems.get(systemID);

    if(!system) {
        Logger.log(false, "System does not exist!", "SystemManager.prototype.addEntity", {systemID, entityID});

        return false;
    }

    system.entities.add(entityID);

    return true;
}

SystemManager.prototype.removeEntity = function(systemID, entityID) {
    const system = this.systems.get(systemID);

    if(!system) {
        Logger.log(false, "System does not exist!", "SystemManager.prototype.removeEntity", {systemID, entityID});

        return false;
    }

    system.entities.delete(entityID);

    return true;
}