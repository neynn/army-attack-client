import { Action } from "../../source/action/action.js";
import { ACTION_TYPES } from "../enums.js";
import { AttackSystem } from "../systems/attack.js";

export const AttackAction = function() {
    this.timePassed = 0;
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onClear = function() {
    this.timePassed = 0;
}

AttackAction.prototype.onStart = function(gameContext, request, messengerID) {
    AttackSystem.beginAttack(gameContext, request);
}

AttackAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { actionQueue } = world;
    const { targetID, attackers, state } = request;

    AttackSystem.endAttack(gameContext, request);

    if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.COUNTER_ATTACK, targetID, attackers));
    }
}

AttackAction.prototype.onUpdate = function(gameContext, request, messengerID) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

AttackAction.prototype.isFinished = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const settings = world.getConfig("Settings");
    const timeRequired = settings.hitDuration;

    return this.timePassed >= timeRequired;
}

AttackAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { entityID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const target = entityManager.getEntity(entityID);

    if(!target) {
        return null;
    }

    const attackers = AttackSystem.getActiveAttackers(gameContext, target);

    if(attackers.length === 0) {
        return null;
    }

    const outcome = AttackSystem.getOutcome(target, attackers);

    return outcome;
}

AttackAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}