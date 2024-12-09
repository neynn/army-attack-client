import { Logger } from "../logger.js";

export const ControllerManager = function() {
    this.controllerTypes = {};
    this.constructors = new Map();
    this.controllers = new Map();
}

ControllerManager.prototype.load = function(controllerTypes) {
    if(typeof controllerTypes === "object") {
        this.controllerTypes = controllerTypes;
    } else {
        Logger.log(false, "ControllerTypes cannot be undefined!", "ControllerManager.prototype.load", null);
    }
}

ControllerManager.prototype.registerController = function(typeID, type) {
    if(!typeID || !type) {
        Logger.log(false, "Parameter is undefined!", "ControllerManager.prototype.registerController", {typeID, type});
        return;
    }

    if(this.constructors.has(typeID)) {
        Logger.log(false, "ControllerType is already registered!", "ControllerManager.prototype.registerController", {typeID});
        return;
    }

    this.constructors.set(typeID, type);
}

ControllerManager.prototype.createController = function(typeID, controllerID) {
    if(!this.constructors.has(typeID) || this.controllers.has(controllerID)) {
        Logger.log(false, "ControllerType does not exist or controllerID is already reserved!", "ControllerManager.prototype.createController", {typeID, controllerID});

        return null;
    }

    const controllerConfig = this.controllerTypes[typeID];
    const ControllerType = this.constructors.get(typeID);
    const controller = new ControllerType(controllerID);

    if(controllerConfig) {
        controller.setConfig(controllerConfig);
    } 

    this.controllers.set(controllerID, controller);

    return controller;
}

ControllerManager.prototype.destroyController = function(controllerID) {
    if(!this.controllers.has(controllerID)) {
        Logger.log(false, "Controller does not exist!", "ControllerManager.prototype.destroyController", {controllerID});
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

ControllerManager.prototype.removeEntity = function(entityID) {
    this.controllers.forEach(controller => controller.removeEntity(entityID));
}

ControllerManager.prototype.addEntity = function(controllerID, entityID) {
    if(!controllerID || !entityID) {
        Logger.error(false, "Parameter is undefined!", "ControllerManager.prototype.addEntity", { controllerID, entityID });
        return;
    }

    const controller = this.controllers.get(controllerID);

    if(!controller) {
        Logger.error(false, "Controller does not exist!", "ControllerManager.prototype.addEntity", { controllerID, entityID });
        return;
    }

    controller.addEntity(entityID);
}