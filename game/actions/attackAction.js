import { Action } from "../../source/action/action.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";

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
    const { attackers, target } = request;
    const { id, state } = target;

    AttackSystem.endAttack(gameContext, target, attackers);
    AnimationSystem.playIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        actionQueue.addImmediateRequest(ACTION_TYPE.COUNTER_ATTACK, null, id, attackers);
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

    if(!attackerEntities) {
        return null;
    }

    const attackerIDs = attackerEntities.map(entity => entity.getID());
    const targetObject = AttackSystem.getAttackTarget(target, attackerEntities);
    
    return {
        "timePassed": 0,
        "attackers": attackerIDs,
        "target": targetObject
    }
}

AttackAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}