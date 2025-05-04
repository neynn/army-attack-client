import { Action } from "../../source/action/action.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterMoveAction = function() {}

CounterMoveAction.prototype = Object.create(Action.prototype);
CounterMoveAction.prototype.constructor = CounterMoveAction;

CounterMoveAction.prototype.onStart = function(gameContext, request) {
    AttackSystem.beginAttack(gameContext, request);
}

CounterMoveAction.prototype.onEnd = function(gameContext, request) {
    AttackSystem.endAttack(gameContext, request);
}

CounterMoveAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

CounterMoveAction.prototype.isFinished = function(gameContext, request) {
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

    if(!attackers) {
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