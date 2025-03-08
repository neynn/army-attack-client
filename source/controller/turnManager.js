import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const TurnManager = function() {
    FactoryOwner.call(this);

    this.controllers = new Map();
    this.actorOrder = [];
    this.actorIndex = 0;
}

TurnManager.prototype = Object.create(FactoryOwner.prototype);
TurnManager.prototype.constructor = TurnManager;

TurnManager.prototype.createController = function(gameContext, config, controllerID) {
    if(this.controllers.has(controllerID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "ControllerID is already taken!", "TurnManager.prototype.createController", { "controllerID": controllerID });

        return null;
    }

    const controller = this.createProduct(gameContext, config);

    if(!controller) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller could not be created!", "TurnManager.prototype.createController", { "controllerID": controllerID });
        
        return null;
    }
    
    controller.setID(controllerID);
    
    this.controllers.set(controllerID, controller);

    return controller;
}

TurnManager.prototype.destroyController = function(controllerID) {
    if(!this.controllers.has(controllerID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller does not exist!", "TurnManager.prototype.destroyController", { "controllerID": controllerID });

        return;
    }

    this.controllers.delete(controllerID);
}

TurnManager.prototype.getController = function(controllerID) {
    const controller = this.controllers.get(controllerID);

    if(!controller) {
        return null;
    }

    return controller;
}

TurnManager.prototype.getNextActor = function() {
    if(this.actorOrder.length === 0) {
        return null;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.controllers.get(currentActorID);
    const hasActionsLeft = currentActor.hasActionsLeft();

    if(hasActionsLeft) {
        return currentActor;
    }

    this.actorIndex++;
    this.actorIndex %= this.actorOrder.length;

    const actorID = this.actorOrder[this.actorIndex];
    const actor = this.constructor.get(actorID);

    return actor;
}

TurnManager.prototype.setActorOrder = function(order) {
    for(let i = 0; i < order.length; i++) {
        const actorID = order[i];

        if(!this.controllers.has(actorID)) {
            return false;
        }
    }

    this.actorOrder = order;
    this.actorIndex = 0;

    return true;
}

TurnManager.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    this.controllers.forEach(controller => controller.update(gameContext));

    const isQueueRunning = actionQueue.isRunning();

    if(isQueueRunning) {
        return;
    }

    const actor = this.getNextActor();

    if(actor) {
        const hasActionsLeft = actor.hasActionsLeft();

        if(hasActionsLeft) {
            const choiceMade = actor.makeChoice(gameContext);

            if(choiceMade) {
                console.log("A choice has been made!");
            }
        }
    }
}

TurnManager.prototype.removeEntity = function(controllerID, entityID) {
    const owner = this.controllers.get(controllerID);

    if(!owner) {
        return;
    }

    owner.removeEntity(entityID);
}

TurnManager.prototype.addEntity = function(controllerID, entityID) {
    const owner = this.controllers.get(controllerID);

    if(!owner) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Controller does not exist!", "TurnManager.prototype.addEntity", { "controllerID": controllerID });

        return;
    }

    owner.addEntity(entityID);
}