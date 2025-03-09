import { Action } from "../../source/action/action.js";
import { AnimationSystem } from "../systems/animation.js";
import { SpawnSystem } from "../systems/spawn.js";

export const DeathAction = function() {}   

DeathAction.prototype = Object.create(Action.prototype);
DeathAction.prototype.constructor = DeathAction;

DeathAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { entityID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    AnimationSystem.playDeath(gameContext, entity);
    SpawnSystem.destroyEntity(gameContext, entity);
}

DeathAction.prototype.isFinished = function(gameContext, request, messengerID) {
    return true;
}

DeathAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { entityID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    return {
        "entityID": entityID
    }
}

DeathAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}