import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const ControllerManager = function() {
    FactoryOwner.call(this);

    this.controllers = new Map();
}

ControllerManager.prototype = Object.create(FactoryOwner.prototype);
ControllerManager.prototype.constructor = ControllerManager;

ControllerManager.prototype.createController = function(gameContext, config, controllerID) {
    if(this.controllers.has(controllerID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "ControllerID is already taken!", "ControllerManager.prototype.createController", { "controllerID": controllerID });

        return null;
    }

    const controller = this.createProduct(gameContext, config);

    if(!controller) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller could not be created!", "ControllerManager.prototype.createController", { "controllerID": controllerID });
        
        return null;
    }
    
    controller.setID(controllerID);
    
    this.controllers.set(controllerID, controller);

    return controller;
}

ControllerManager.prototype.destroyController = function(controllerID) {
    if(!this.controllers.has(controllerID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller does not exist!", "ControllerManager.prototype.destroyController", { "controllerID": controllerID });

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

ControllerManager.prototype.removeEntity = function(controllerID, entityID) {
    const owner = this.controllers.get(controllerID);

    if(!owner) {
        return;
    }

    owner.removeEntity(entityID);
}

ControllerManager.prototype.addEntity = function(controllerID, entityID) {
    const owner = this.controllers.get(controllerID);

    if(!owner) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller does not exist!", "ControllerManager.prototype.addEntity", { "controllerID": controllerID });

        return;
    }

    owner.addEntity(entityID);
}