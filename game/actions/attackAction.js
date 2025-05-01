import { Action } from "../../source/action/action.js";
import { ACTION_TYPE } from "../enums.js";
import { AttackSystem } from "../systems/attack.js";

export const AttackAction = function() {}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, request) {
    AttackSystem.beginAttack(gameContext, request);
}

AttackAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { targetID, attackers, state } = request;

    AttackSystem.endAttack(gameContext, request);

    if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        actionQueue.addImmediateRequest(ACTION_TYPE.COUNTER_ATTACK, null, targetID, attackers);
    }
}

AttackAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

AttackAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

AttackAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { entityID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const target = entityManager.getEntity(entityID);

    if(!target) {
        return null;
    }

    const attackerEntities = AttackSystem.getActiveAttackers(gameContext, target, messengerID);

    if(attackerEntities.length === 0) {
        return null;
    }

    const outcome = AttackSystem.getOutcome(target, attackerEntities);
    
    return {
        "timePassed": 0,
        "state": outcome.state,
        "damage": outcome.damage,
        "attackers": outcome.attackers,
        "targetID": outcome.targetID
    }
}

AttackAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}