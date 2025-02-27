import { Action } from "../../source/action/action.js";
import { ACTION_TYPES, EVENT_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { DecaySystem } from "../systems/decay.js";

export const AttackAction = function() {
    this.timePassed = 0;
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onClear = function() {
    this.timePassed = 0;
}

AttackAction.prototype.onStart = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager, eventManager } = world;
    const { targetID, attackers, damage, state } = request;
    const target = entityManager.getEntity(targetID);

    AnimationSystem.playFire(gameContext, target, attackers);
    target.reduceHealth(damage);

    if(state === AttackSystem.OUTCOME_STATE.DOWN) {
        DecaySystem.beginDecay(gameContext, target);
        eventManager.emitEvent(EVENT_TYPES.COUNTER, {
            "targetID": targetID,
            "attackers": attackers,
            "controllerID": messengerID
        });
    } else {
        target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.HIT);
    }
}

AttackAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager, eventManager, actionQueue } = world;
    const { targetID, attackers, damage, state } = request;
    const target = entityManager.getEntity(targetID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.DEAD) {
        AnimationSystem.playDeath(gameContext, target);
        target.die(gameContext);
        eventManager.emitEvent(EVENT_TYPES.COUNTER, {
            "targetID": targetID,
            "attackers": attackers,
            "controllerID": messengerID
        });
    } else if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
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