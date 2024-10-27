import { ACTION_TYPES } from "../enums.js";
import { Action } from "../source/action/action.js";
import { ControllerSystem } from "../systems/controller.js";
import { FireSystem } from "../systems/fire.js";
import { HealthSystem } from "../systems/health.js";
import { TargetSystem } from "../systems/target.js";

//TODO add nextAction field, that pushes the next action on the queue. that gets validated before being sent to the client/server.
/**
 * Client-Side action.
 * timePassed is in seconds.
 */
export const AttackAction = function() {
    Action.call(this);
    this.id = ACTION_TYPES.ATTACK;
    this.timePassed = 0;
}

AttackAction.prototype = Object.create(Action.prototype);
AttackAction.prototype.constructor = AttackAction;

AttackAction.prototype.onStart = function(gameContext, request) {
    const { entityManager } = gameContext;
    const { entityID, attackers, damage } = request;
    const target = entityManager.getEntity(entityID);

    ControllerSystem.clearAttackers(gameContext);
    FireSystem.startAttack(gameContext, target, attackers);
    HealthSystem.reduceHealth(target, damage);

    this.timePassed = 0;
}

AttackAction.prototype.onEnd = function(gameContext, request) {
    const { entityManager } = gameContext;
    const { entityID, attackers, damage } = request;
    const target = entityManager.getEntity(entityID);

    FireSystem.endAttack(gameContext, target, attackers);
    //Return to idle animation
    //if request.isDead -> if NOT reviveable -> killDaHo!
    this.timePassed = 0;
}

AttackAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const settings = gameContext.getConfig("settings");
    const timeRequired = settings.hitDuration;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;

    if(this.timePassed >= timeRequired) {
        return true;
    }

    return false;
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

    request.attackers = attackers;
    request.damage = damage;

    if(HealthSystem.wouldDie(targetEntity, damage)) {
        request.isFatal = true;
    }

    return true;
}

export const createAttackRequest = function(entityID) {
    return {
        "type": ACTION_TYPES.ATTACK,
        "entityID": entityID,
        "attackers": [], //list of attackerIDs
        "damage": 0,
        "isFatal": false, //TODO rename
    }
}