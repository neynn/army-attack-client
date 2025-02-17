import { Action } from "../../source/action/action.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { DecaySystem } from "../systems/decay.js";

export const CounterMoveAction = function() {
    this.timePassed = 0;
}

CounterMoveAction.prototype = Object.create(Action.prototype);
CounterMoveAction.prototype.constructor = CounterMoveAction;

CounterMoveAction.prototype.onClear = function() {
    this.timePassed = 0;
}

CounterMoveAction.prototype.onStart = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.playFire(gameContext, target, attackers);
    target.reduceHealth(damage);

    if(state === AttackSystem.OUTCOME_STATE.DOWN) {
        DecaySystem.beginDecay(gameContext, target);
    } else {
        target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.HIT);
    }
}

CounterMoveAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { entityID, attackers, damage, state } = request;
    const target = entityManager.getEntity(entityID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.DEAD) {
        AnimationSystem.playDeath(gameContext, target);
        target.die(gameContext);
    } else if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
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

    const damage = AttackSystem.getDamage(gameContext, targetEntity, attackers);
    const state = AttackSystem.getOutcomeState(gameContext, damage, targetEntity, attackers);

    return {
        "entityID": entityID,
        "attackers": attackers,
        "damage": damage,
        "state": state
    }
}

CounterMoveAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}