import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const ControllerManager = function() {
    FactoryOwner.call(this);

    this.controllers = new Map();
}

ControllerManager.prototype = Object.create(FactoryOwner.prototype);
ControllerManager.prototype.constructor = ControllerManager;

ControllerManager.prototype.getOwnerID = function(entityID) {
    for(const [controllerID, controller] of this.controllers) {
        if(controller.hasEntity(entityID)) {
            return controllerID;
        }
    }

    return null;
}

ControllerManager.prototype.createController = function(gameContext, config, controllerID) {
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
    const ownerID = this.getOwnerID(entityID);

    if(ownerID === null) {
        return;
    }

    const owner = this.controllers.get(ownerID);

    if(!owner) {
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

    const ownerID = this.getOwnerID(entityID);

    if(ownerID !== null) {
        const owner = this.getController(ownerID);

        if(owner) {
            owner.removeEntity(entityID);
        }

        Logger.log(false, "Entity is already linked to controller! Transferring ownership!", { controllerID, entityID });
    }

    controller.addEntity(entityID);
}