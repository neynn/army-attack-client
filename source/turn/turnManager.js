import { EventEmitter } from "../events/eventEmitter.js";
import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";

export const TurnManager = function() {
    FactoryOwner.call(this);

    this.actors = new Map();
    this.actorOrder = [];
    this.actorIndex = -1;
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

TurnManager.prototype.forAllActors = function(onCall) {
    for(const [actorID, actor] of this.actors) {
        onCall(actor, actorID);
    }
}

TurnManager.prototype.createActor = function(gameContext, config, actorID) {
    if(this.actors.has(actorID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "ActorID is already taken!", "TurnManager.prototype.createActor", { "actorID": actorID });

        return null;
    }

    const actor = this.createProduct(gameContext, config);

    if(!actor) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor could not be created!", "TurnManager.prototype.createActor", { "actorID": actorID });
        
        return null;
    }
    
    actor.setID(actorID);
    
    this.actors.set(actorID, actor);

    return actor;
}

TurnManager.prototype.destroyActor = function(actorID) {
    if(!this.actors.has(actorID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "TurnManager.prototype.destroyActor", { "actorID": actorID });

        return;
    }

    this.actors.delete(actorID);
}

TurnManager.prototype.getActor = function(actorID) {
    const actor = this.actors.get(actorID);

    if(!actor) {
        return null;
    }

    return actor;
}

TurnManager.prototype.isActor = function(actorID) {
    if(this.actorIndex === -1) {
        return false;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const isActor = actorID === currentActorID;

    return isActor;
}

TurnManager.prototype.getNextActor = function(gameContext) {
    if(this.actorOrder.length === 0) {
        return null;
    }

    if(this.actorIndex === -1) {
        this.actorIndex++;

        const firstActorID = this.actorOrder[this.actorIndex];
        const firstActor = this.actors.get(firstActorID);
        
        firstActor.onTurnStart(gameContext);   

        this.actionsLeft = firstActor.maxActions;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.actors.get(currentActorID);

    if(this.actionsLeft > 0) {
        return currentActor;
    }

    this.actorIndex++;
    this.actorIndex %= this.actorOrder.length;

    const actorID = this.actorOrder[this.actorIndex];
    const actor = this.actors.get(actorID);

    currentActor.onTurnEnd(gameContext);
    actor.onTurnStart(gameContext);   

    this.actionsLeft = actor.maxActions;
    this.events.emit(TurnManager.EVENT.ACTOR_CHANGE, currentActorID, actorID);

    return actor;
}

TurnManager.prototype.getCurrentActor = function() {
    if(this.actorIndex === -1) {
        return null;
    }

    const currentActorID = this.actorOrder[this.actorIndex];
    const currentActor = this.actors.get(currentActorID);

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

TurnManager.prototype.setActorOrder = function(gameContext, order, index = -1) {
    if(order.length === 0) {
        return false;
    }

    for(let i = 0; i < order.length; i++) {
        const actorID = order[i];

        if(!this.actors.has(actorID)) {
            return false;
        }
    }

    if(index >= order.length) {
        return false;
    }

    this.actorOrder = order;
    this.actorIndex = index;

    const currentActor = this.getCurrentActor();

    if(currentActor) {
        this.actionsLeft = currentActor.maxActions;

        currentActor.onTurnStart(gameContext);
    }

    return true;
}

TurnManager.prototype.update = function(gameContext) {
    const { world } = gameContext;
    const { actionQueue } = world;

    this.actors.forEach(actor => actor.update(gameContext));

    const isQueueRunning = actionQueue.isRunning();

    if(isQueueRunning) {
        return;
    }

    const actor = this.getNextActor(gameContext);

    if(actor && this.actionsLeft > 0) {
        actor.makeChoice(gameContext)
    }
}

TurnManager.prototype.removeEntity = function(actorID, entityID) {
    const owner = this.actors.get(actorID);

    if(!owner) {
        return;
    }

    owner.removeEntity(entityID);
}

TurnManager.prototype.addEntity = function(actorID, entityID) {
    const owner = this.actors.get(actorID);

    if(!owner) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Actor does not exist!", "TurnManager.prototype.addEntity", { "actorID": actorID });

        return;
    }

    owner.addEntity(entityID);
}