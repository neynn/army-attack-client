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

SystemManager.prototype.registerSystem = function(systemID, onUpdate) {
    if(this.systems.has(systemID)) {
        Logger.log(false, "System already exists!", "SystemManager.prototype.registerSystem", { systemID });
        return;
    }

    if(typeof onUpdate !== "function") {
        Logger.log(false, "System is invalid!", "SystemManager.prototype.registerSystem", { systemID });
        return;
    }

    const system = new System(systemID, onUpdate);

    this.systems.set(systemID, system);
}

SystemManager.prototype.addEntity = function(systemID, entityID) {
    const system = this.systems.get(systemID);

    if(!system) {
        Logger.log(false, "System does not exist!", "SystemManager.prototype.addEntity", { systemID, entityID });
        return;
    }

    system.addEntity(entityID);
}

SystemManager.prototype.removeEntity = function(systemID, entityID) {
    const system = this.systems.get(systemID);

    if(!system) {
        Logger.log(false, "System does not exist!", "SystemManager.prototype.removeEntity", { systemID, entityID });
        return;
    }

    system.removeEntity(entityID);
}