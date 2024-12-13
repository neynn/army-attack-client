import { Action } from "../../source/action/action.js";

import { ENTITY_STATES } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { HealthSystem } from "../systems/health.js";
import { MorphSystem } from "../systems/morph.js";
import { ReviveSystem } from "../systems/revive.js";
import { TargetSystem } from "../systems/target.js";

export const AttackAction = function() {
    this.timePassed = 0;
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onClear = function() {
    this.timePassed = 0;
}

AttackAction.prototype.onStart = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.playFire(gameContext, target, attackers);
    HealthSystem.reduceHealth(target, damage);

    if(state === ENTITY_STATES.DOWN) {
        ReviveSystem.downEntity(gameContext, target);
    } else {
        MorphSystem.toHit(target);
    }
}

AttackAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    if(state === ENTITY_STATES.DEAD) {
        AnimationSystem.playDeath(gameContext, target);
        world.destroyEntity(entityID);
    } else if(state === ENTITY_STATES.IDLE) {
        MorphSystem.toIdle(target);
    }
}

AttackAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

AttackAction.prototype.isFinished = function(gameContext, request) {
    const { world } = gameContext;
    const settings = world.getConfig("settings");
    const timeRequired = settings.hitDuration;

    return this.timePassed >= timeRequired;
}

AttackAction.prototype.isValid = function(gameContext, request, messengerID) {
    const { entityID } = request;
    const { world } = gameContext; 
    const { entityManager } = world;
    const targetEntity = entityManager.getEntity(entityID);

    if(!targetEntity) {
        return false;
    }

    const attackers = TargetSystem.getAttackers(gameContext, targetEntity);

    if(attackers.length === 0) {
        return false;
    }

    const damage = AttackSystem.getDamage(gameContext, targetEntity, attackers);
    const health = HealthSystem.getRemainingHealth(targetEntity, damage);

    request.attackers = attackers;
    request.damage = damage;
    request.state = ENTITY_STATES.IDLE;

    if(health === 0) {
        const isBulldozed = AttackSystem.isBulldozed(gameContext, targetEntity, attackers);
        const isReviveable = ReviveSystem.isReviveable(targetEntity);

        if(isReviveable && !isBulldozed) {
            request.state = ENTITY_STATES.DOWN;
        } else {
            request.state = ENTITY_STATES.DEAD;
        }
    }
    
    return true;
}

AttackAction.prototype.createRequest = function(entityID) {
    return {
        "entityID": entityID,
        "attackers": [],
        "damage": 0,
        "state": ENTITY_STATES.IDLE
    }
}