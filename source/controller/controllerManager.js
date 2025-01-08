import { Logger } from "../logger.js";

export const ControllerManager = function() {
    this.controllerTypes = {};
    this.registry = new Map();
    this.controllers = new Map();
}

ControllerManager.prototype.load = function(controllerTypes) {
    if(typeof controllerTypes !== "object") {
        Logger.log(false, "ControllerTypes cannot be undefined!", "ControllerManager.prototype.load", null);
        return;
    }

    this.controllerTypes = controllerTypes;
}

ControllerManager.prototype.getOwnerOf = function(entityID) {
    for(const [controllerID, controller] of this.controllers) {
        if(controller.hasEntity(entityID)) {
            return controller;
        }
    }

    return null;
}

ControllerManager.prototype.registerController = function(typeID, type) {
    if(!typeID || !type) {
        Logger.log(false, "Parameter is undefined!", "ControllerManager.prototype.registerController", {typeID, type});
        return;
    }

    if(this.registry.has(typeID)) {
        Logger.log(false, "ControllerType is already registered!", "ControllerManager.prototype.registerController", {typeID});
        return;
    }

    this.registry.set(typeID, type);
}

ControllerManager.prototype.createController = function(typeID, controllerID) {
    if(!this.registry.has(typeID) || this.controllers.has(controllerID)) {
        Logger.log(false, "ControllerType does not exist or controllerID is already reserved!", "ControllerManager.prototype.createController", {typeID, controllerID});
        return null;
    }

    const controllerConfig = this.controllerTypes[typeID];
    const ControllerType = this.registry.get(typeID);
    const controller = new ControllerType(controllerID);

    if(controllerConfig) {
        controller.setConfig(controllerConfig);
    } else {
        Logger.log(false, "ControllerType does not exist!", "ControllerManager.prototype.createController", { typeID });
    }

    this.controllers.set(controllerID, controller);

    return controller;
}

ControllerManager.prototype.destroyController = function(controllerID) {
    if(!this.controllers.has(controllerID)) {
        Logger.log(false, "Controller does not exist!", "ControllerManager.prototype.destroyController", { controllerID });
        return;
    }

    this.controllers.delete(controllerID);
}

ControllerManager.prototype.getController = function(controllerID) {
    const controller = this.controllers.get(controllerID);

    if(!controller) {
        return null;
    }

    return controller;
}

ControllerManager.prototype.update = function(gameContext) {
    this.controllers.forEach(controller => controller.update(gameContext));
}

ControllerManager.prototype.addEntity = function(controllerID, entityID) {
    const controller = this.controllers.get(controllerID);

    if(!controller) {
        Logger.error(false, "Controller does not exist!", "ControllerManager.prototype.addEntity", { controllerID, entityID });
        return;
    }

    const currentOwner = this.getOwnerOf(entityID);

    if(currentOwner !== null) {
        Logger.warn(false, "Entity is already linked to controller! Transferring ownership!", { controllerID, entityID });

        currentOwner.removeEntity(entityID);
    }

    controller.addEntity(entityID);
}