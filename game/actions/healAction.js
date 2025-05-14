import { Action } from "../../source/action/action.js";
import { ActionRequest } from "../../source/action/actionRequest.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { DecaySystem } from "../systems/decay.js";
import { HealSystem } from "../systems/heal.js";

export const HealAction = function() {
    Action.call(this);
}

HealAction.prototype = Object.create(Action.prototype);
HealAction.prototype.constructor = HealAction;

HealAction.prototype.onStart = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager, turnManager } = world;
    const { entityID, actorID, cost } = request;
    const entity = entityManager.getEntity(entityID);
    const actor = turnManager.getActor(actorID);

    HealSystem.takeSupplies(actor, cost);
    DecaySystem.endDecay(entity);
    AnimationSystem.playHeal(gameContext, entity);
}

HealAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, health } = request;
    const entity = entityManager.getEntity(entityID);

    HealSystem.healEntity(gameContext, entity, health);
}

HealAction.prototype.isFinished = function(gameContext, request) {
    const constructionDuration = gameContext.settings.iconDuration;

    return request.timePassed >= constructionDuration;
}

HealAction.prototype.getValidated = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager, turnManager } = world;
    const { actorID, entityID } = request;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const actor = turnManager.getActor(actorID);

    if(!actor) {
        return null;
    }

    const isHealable = HealSystem.isEntityHealable(entity, actor);

    if(!isHealable) {
        return null;
    }

    const health = HealSystem.getMissingHealth(entity);
    const cost = HealSystem.getSuppliesRequired(entity, health);

    return {
        "entityID": entityID,
        "actorID": actorID,
        "health": health,
        "cost": cost
    }
}

HealAction.createRequest = function(actorID, entityID) {
    const request = new ActionRequest(ACTION_TYPE.HEAL, {
        "actorID": actorID,
        "entityID": entityID
    });

    return request;
}