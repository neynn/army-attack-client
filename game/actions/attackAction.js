import { Action } from "../../source/action/action.js";
import { ActionRequest } from "../../source/action/actionRequest.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { CounterAttackAction } from "./counterAttackAction.js";

export const AttackAction = function() {
    Action.call(this);
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, request) {
    const { attackers, target } = request;

    AttackSystem.updateTarget(gameContext, target);
    AnimationSystem.playFire(gameContext, target, attackers);
}

AttackAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { actorID, attackers, target } = request;
    const { id, state } = target;

    AttackSystem.endAttack(gameContext, target, actorID);
    AnimationSystem.playIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        actionQueue.addImmediateRequest(CounterAttackAction.createRequest(id, attackers));
    }
}

AttackAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

AttackAction.prototype.getValidated = function(gameContext, request) {
    const { entityID, actorID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const target = entityManager.getEntity(entityID);

    if(!target) {
        return null;
    }

    const attackerEntities = AttackSystem.getActiveAttackers(gameContext, target, actorID);

    if(!attackerEntities) {
        return null;
    }

    const attackerIDs = attackerEntities.map(entity => entity.getID());
    const targetObject = AttackSystem.getAttackTarget(target, attackerEntities);
    
    return {
        "actorID": actorID,
        "attackers": attackerIDs,
        "target": targetObject
    }
}

AttackAction.createRequest = function(actorID, entityID) {
    const request = new ActionRequest(ACTION_TYPE.ATTACK, {
        "actorID": actorID,
        "entityID": entityID
    });
    
    return request;
}