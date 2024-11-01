import { ACTION_TYPES } from "../enums.js";
import { Action } from "../source/action/action.js";
import { ControllerSystem } from "../systems/controller.js";
import { DeathSystem } from "../systems/death.js";
import { FireSystem } from "../systems/fire.js";
import { HealthSystem } from "../systems/health.js";
import { MorphSystem } from "../systems/morph.js";
import { ReviveSystem } from "../systems/revive.js";
import { TargetSystem } from "../systems/target.js";

export const AttackAction = function() {
    Action.call(this);
    this.id = ACTION_TYPES.ATTACK;
    this.timePassed = 0;
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onClear = function() {
    this.timePassed = 0;
}

AttackAction.prototype.onStart = function(gameContext, request) {
    const { entityManager } = gameContext;
    const { entityID, attackers, damage, remainingHealth, isFatal } = request;
    const target = entityManager.getEntity(entityID);

    ControllerSystem.clearAttackers(gameContext);
    FireSystem.startAttack(gameContext, attackers, target);
    HealthSystem.setHealth(target, remainingHealth);

    const isDead = !HealthSystem.isAlive(target);
    const isReviveable = ReviveSystem.isReviveable(target);

    if(isDead && isReviveable && !isFatal) {
        ReviveSystem.downEntity(gameContext, target);
    } else {
        MorphSystem.updateSprite(target, "hit");
    }
}

AttackAction.prototype.onEnd = function(gameContext, request) {
    const { entityManager } = gameContext;
    const { entityID, attackers, damage, remainingHealth, isFatal } = request;
    const target = entityManager.getEntity(entityID);

    FireSystem.endAttack(gameContext, attackers);

    const isDead = !HealthSystem.isAlive(target);
    const isReviveable = ReviveSystem.isReviveable(target);

    if(isDead) {
        if(!isReviveable || isFatal) {
            DeathSystem.playDeathAnimation(gameContext, target);
            DeathSystem.destroyEntity(gameContext, entityID);
        }
    } else {
        MorphSystem.updateSprite(target, "idle");
    }
}

AttackAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const settings = gameContext.getConfig("settings");
    const timeRequired = settings.hitDuration;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;

    return this.timePassed >= timeRequired;
}

AttackAction.prototype.validate = function(gameContext, request) {
    const { entityID } = request;
    const { entityManager } = gameContext; 
    const targetEntity = entityManager.getEntity(entityID);

    if(!targetEntity) {
        return false;
    }

    const attackers = TargetSystem.getAttackers(gameContext, targetEntity);

    if(attackers.length === 0) {
        return false;
    }

    const damage = FireSystem.getDamage(gameContext, targetEntity, attackers);

    if(damage === 0) {
        return false;
    }

    const isFatal = FireSystem.getFatal(gameContext, targetEntity, attackers);
    const remainingHealth = HealthSystem.getRemainingHealth(targetEntity, damage);

    request.attackers = attackers;
    request.remainingHealth = remainingHealth;
    request.damage = damage;
    request.isFatal = isFatal;

    return true;
}

export const createAttackRequest = function(entityID) {
    return {
        "type": ACTION_TYPES.ATTACK,
        "entityID": entityID,
        "attackers": [],
        "remainingHealth": 0,
        "damage": 0,
        "isFatal": false
    }
}