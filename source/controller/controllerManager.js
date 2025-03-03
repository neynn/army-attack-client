import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const ControllerManager = function() {
    FactoryOwner.call(this);

    this.controllers = new Map();
}

ControllerManager.prototype = Object.create(FactoryOwner.prototype);
ControllerManager.prototype.constructor = ControllerManager;

ControllerManager.prototype.getOwnerOf = function(entityID) {
    for(const [controllerID, controller] of this.controllers) {
        if(controller.hasEntity(entityID)) {
            return controller;
        }
    }

    return null;
}

ControllerManager.prototype.createController = function(gameContext, controllerID, config) {
    if(this.controllers.has(controllerID)) {
        Logger.log(false, "ControllerID is already taken!", "ControllerManager.prototype.createController", { controllerID });
        return null;
    }

    const controller = this.createProduct(gameContext, config);

    if(!controller) {
        Logger.log(false, "Factory has not returned a controller!", "ControllerManager.prototype.createController", { config, controllerID });
        return null;
    }
    
    controller.setID(controllerID);
    
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

ControllerManager.prototype.removeEntity = function(entityID) {
    const owner = this.getOwnerOf(entityID);

    if(!owner) {
        //TODO: ERROR
        return;
    }

    owner.removeEntity(entityID);
}

ControllerManager.prototype.addEntity = function(controllerID, entityID) {
    const controller = this.controllers.get(controllerID);

    if(!controller) {
        Logger.log(false, "Controller does not exist!", "ControllerManager.prototype.addEntity", { controllerID, entityID });
        return;
    }

    const currentOwner = this.getOwnerOf(entityID);

    if(currentOwner !== null) {
        Logger.log(false, "Entity is already linked to controller! Transferring ownership!", { controllerID, entityID });

        currentOwner.removeEntity(entityID);
    }

    controller.addEntity(entityID);
}