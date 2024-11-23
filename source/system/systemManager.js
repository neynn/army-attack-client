import { Logger } from "../logger.js";
import { System } from "./system.js";

export const SystemManager = function() {
    this.config = {};
    this.systems = new Map();
}

SystemManager.prototype.update = function(gameContext) {    
    for(const [systemID, system] of this.systems) {
        system.update(gameContext);
    }
}

SystemManager.prototype.registerSystem = function(systemID, reference) {
    if(this.systems.has(systemID)) {
        Logger.log(false, "System already exists!", "SystemManager.prototype.registerSystem", {systemID});

        return false;
    }

    if(typeof reference !== "function") {
        Logger.log(false, "System is invalid!", "SystemManager.prototype.registerSystem", {systemID});

        return false;
    }

    const system = new System(systemID, reference);
    this.systems.set(systemID, system);

    return true;
}

SystemManager.prototype.addEntity = function(systemID, entityID) {
    const system = this.systems.get(systemID);

    if(!system) {
        Logger.log(false, "System does not exist!", "SystemManager.prototype.addEntity", {systemID, entityID});

        return false;
    }

    system.addEntity(entityID);

    return true;
}

SystemManager.prototype.removeEntity = function(systemID, entityID) {
    const system = this.systems.get(systemID);

    if(!system) {
        Logger.log(false, "System does not exist!", "SystemManager.prototype.removeEntity", {systemID, entityID});

        return false;
    }

    system.removeEntity(entityID);

    return true;
}