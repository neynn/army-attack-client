import { Action } from "../../source/action/action.js";
import { HealthComponent } from "../components/health.js";

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

AttackAction.STATE_IDLE = 0;
AttackAction.STATE_DOWN = 1;
AttackAction.STATE_DEAD = 2;

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

    if(state === AttackAction.STATE_DOWN) {
        DecaySystem.beginDecay(gameContext, target);
    } else {
        MorphSystem.toHit(gameContext, target);
    }
}

AttackAction.prototype.onEnd = function(gameContext, request) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    if(state === AttackAction.STATE_DEAD) {
        AnimationSystem.playDeath(gameContext, target);
        DeathSystem.destroyEntity(gameContext, entityID);
    } else if(state === AttackAction.STATE_IDLE) {
        MorphSystem.toIdle(gameContext, target);
    }
}

AttackAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

AttackAction.prototype.isFinished = function(gameContext, request) {
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

    let state = AttackAction.STATE_IDLE;
    const healthComponent = targetEntity.getComponent(HealthComponent);
    const damage = AttackSystem.getDamage(gameContext, targetEntity, attackers);
    const remainder = healthComponent.getRemainder(damage);

    if(remainder === 0) {
        const isBulldozed = AttackSystem.getBulldozed(gameContext, targetEntity, attackers);
        const isReviveable = DecaySystem.isReviveable(targetEntity);

        if(isReviveable && !isBulldozed) {
            state = AttackAction.STATE_DOWN;
        } else {
            state = AttackAction.STATE_DEAD;
        }
    }
    
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