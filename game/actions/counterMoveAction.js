import { Action } from "../../source/action/action.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterMoveAction = function() {}

CounterMoveAction.prototype = Object.create(Action.prototype);
CounterMoveAction.prototype.constructor = CounterMoveAction;

CounterMoveAction.prototype.onStart = function(gameContext, request, messengerID) {
    AttackSystem.beginAttack(gameContext, request);
}

CounterMoveAction.prototype.onEnd = function(gameContext, request, messengerID) {

    //TODO: Get owner of majority attackers OR drop for every owner/attacker
    AttackSystem.endAttack(gameContext, request, null);
}

CounterMoveAction.prototype.onUpdate = function(gameContext, request, messengerID) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

CounterMoveAction.prototype.isFinished = function(gameContext, request, messengerID) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

CounterMoveAction.prototype.getValidated = function(gameContext, template, messengerID) {
    const { entityID } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const targetEntity = entityManager.getEntity(entityID);

    if(!targetEntity) {
        return null;
    }

    const attackers = AttackSystem.getMoveCounterAttackers(gameContext, targetEntity);

    if(attackers.length === 0) {
        return null;
    }

    const outcome = AttackSystem.getOutcome(targetEntity, attackers);
    
    return {
        "timePassed": 0,
        "state": outcome.state,
        "damage": outcome.damage,
        "attackers": outcome.attackers,
        "targetID": outcome.targetID
    }
}

CounterMoveAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}