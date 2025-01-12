import { Action } from "../../source/action/action.js";
import { CounterComponent } from "../components/counter.js";
import { ACTION_TYPES, EVENT_TYPES } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { DeathSystem } from "../systems/death.js";
import { DecaySystem } from "../systems/decay.js";
import { HealthSystem } from "../systems/health.js";
import { MorphSystem } from "../systems/morph.js";

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
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.playFire(gameContext, target, attackers);
    HealthSystem.reduceHealth(target, damage);

    if(state === AttackSystem.OUTCOME_STATE.DOWN) {
        DecaySystem.beginDecay(gameContext, target);
        eventManager.emitEvent(EVENT_TYPES.COUNTER, {
            "entityID": entityID,
            "attackers": attackers,
            "controllerID": messengerID
        });
    } else {
        MorphSystem.toHit(gameContext, target);
    }
}

AttackAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager, eventManager, actionQueue } = world;
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.DEAD) {
        AnimationSystem.playDeath(gameContext, target);
        DeathSystem.destroyEntity(gameContext, entityID);
        eventManager.emitEvent(EVENT_TYPES.COUNTER, {
            "entityID": entityID,
            "attackers": attackers,
            "controllerID": messengerID
        });
    } else if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        MorphSystem.toIdle(gameContext, target);
        actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.COUNTER_ATTACK, entityID, attackers));
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
    const targetEntity = entityManager.getEntity(entityID);

    if(!targetEntity) {
        return null;
    }

    const attackers = AttackSystem.getActiveAttackers(gameContext, targetEntity);

    if(attackers.length === 0) {
        return null;
    }

    const damage = AttackSystem.getDamage(gameContext, targetEntity, attackers);
    const state = AttackSystem.getOutcomeState(gameContext, damage, targetEntity, attackers);
    
    return {
        "entityID": entityID,
        "attackers": attackers,
        "damage": damage,
        "state": state
    }
}

AttackAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}