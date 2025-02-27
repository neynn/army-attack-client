import { Action } from "../../source/action/action.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterMoveAction = function() {
    this.timePassed = 0;
}

CounterMoveAction.prototype = Object.create(Action.prototype);
CounterMoveAction.prototype.constructor = CounterMoveAction;

CounterMoveAction.prototype.onClear = function() {
    this.timePassed = 0;
}

CounterMoveAction.prototype.onStart = function(gameContext, request, messengerID) {
    AttackSystem.beginAttack(gameContext, request);
}

CounterMoveAction.prototype.onEnd = function(gameContext, request, messengerID) {
    AttackSystem.endAttack(gameContext, request);
}

CounterMoveAction.prototype.onUpdate = function(gameContext, request, messengerID) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

CounterMoveAction.prototype.isFinished = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const settings = world.getConfig("Settings");
    const timeRequired = settings.hitDuration;

    return this.timePassed >= timeRequired;
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
    
    return outcome;
}

CounterMoveAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}