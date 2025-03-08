import { EventEmitter } from "../events/eventEmitter.js";
import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const TurnManager = function() {
    FactoryOwner.call(this);

    this.controllers = new Map();
    this.actorOrder = [];
    this.actorIndex = 0;
    this.actionsLeft = 0;

    this.events = new EventEmitter();
    this.events.listen(TurnManager.EVENT.ACTOR_CHANGE);
    this.events.listen(TurnManager.EVENT.ACTIONS_REDUCE);
    this.events.listen(TurnManager.EVENT.ACTIONS_CLEAR);
}

TurnManager.EVENT = {
    ACTOR_CHANGE: "ACTOR_CHANGE",
    ACTIONS_REDUCE: "ACTIONS_REDUCE",
    ACTIONS_CLEAR: "ACTIONS_CLEAR"
};

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

TurnManager.prototype.isActor = function(actorID) {
    if(this.actorOrder.length === 0) {
        return false;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const isActor = actorID === currentActorID;

    return isActor;
}

TurnManager.prototype.getNextActor = function() {
    if(this.actorOrder.length === 0) {
        return null;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.controllers.get(currentActorID);

    if(this.actionsLeft > 0) {
        return currentActor;
    }

    this.actorIndex++;
    this.actorIndex %= this.actorOrder.length;

    const actorID = this.actorOrder[this.actorIndex];
    const actor = this.controllers.get(actorID);

    this.actionsLeft = actor.maxActions;
    this.events.emit(TurnManager.EVENT.ACTOR_CHANGE, currentActorID, actorID);

    return actor;
}

TurnManager.prototype.getCurrentActor = function() {
    if(this.actorOrder.length === 0) {
        return null;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.controllers.get(currentActorID);

    return currentActor;
}

TurnManager.prototype.cancelActorActions = function() {
    const currentActor = this.getCurrentActor();

    if(!currentActor) {
        return;
    }

    this.actionsLeft = 0;
    this.events.emit(TurnManager.EVENT.ACTIONS_CLEAR, currentActor, this.actionsLeft);
}

TurnManager.prototype.reduceActorActions = function(value) {
    const currentActor = this.getCurrentActor();

    if(!currentActor) {
        return;
    }

    this.actionsLeft -= value;

    if(this.actionsLeft < 0) {
        this.actionsLeft = 0;
    }

    this.events.emit(TurnManager.EVENT.ACTIONS_REDUCE, currentActor, this.actionsLeft);
}

TurnManager.prototype.setActorOrder = function(order, index) {
    if(order.length === 0) {
        return false;
    }

    for(let i = 0; i < order.length; i++) {
        const actorID = order[i];

        if(!this.controllers.has(actorID)) {
            return false;
        }
    }

    this.actorOrder = order;

    if(index) {
        this.actorIndex = index;
    } else {
        this.actorIndex = 0;
    }

    const currentActor = this.getCurrentActor();

    if(currentActor) {
        this.actionsLeft = currentActor.maxActions;
    }

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

    if(actor && this.actionsLeft > 0) {
        actor.makeChoice(gameContext)
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