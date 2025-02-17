import { Action } from "../../source/action/action.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { DecaySystem } from "../systems/decay.js";

export const CounterAttackAction = function() {
    this.timePassed = 0;
}

CounterAttackAction.prototype = Object.create(Action.prototype);
CounterAttackAction.prototype.constructor = CounterAttackAction;

CounterAttackAction.prototype.onStart = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackers, targetID, damage, state } = request;
    const target = entityManager.getEntity(targetID);

    AnimationSystem.playFire(gameContext, target, attackers);
    target.reduceHealth(damage);

    if(state === AttackSystem.OUTCOME_STATE.DOWN) {
        DecaySystem.beginDecay(gameContext, target);
    } else {
        target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.HIT);
    }
}

CounterAttackAction.prototype.onEnd = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { entityManager } = world;
    const { attackers, targetID, damage, state } = request;
    const target = entityManager.getEntity(targetID);

    AnimationSystem.revertToIdle(gameContext, attackers);

    if(state === AttackSystem.OUTCOME_STATE.DEAD) {
        AnimationSystem.playDeath(gameContext, target);
        target.die(gameContext);
    } else if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        target.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    }
}

CounterAttackAction.prototype.onClear = function() {
    this.timePassed = 0;
}

CounterAttackAction.prototype.onUpdate = function(gameContext, request, messengerID) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    this.timePassed += deltaTime;
}

CounterAttackAction.prototype.isFinished = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const settings = world.getConfig("Settings");
    const timeRequired = settings.hitDuration;

    return this.timePassed >= timeRequired;
}

CounterAttackAction.prototype.getValidated = function(gameContext, template, messengerID) {
    const { entityID, attackers } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const counterComponent = entity.getComponent(ArmyEntity.COMPONENT.COUNTER);
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!counterComponent || !counterComponent.isAttackCounterable() || !healthComponent.isAlive()) {
        return null;
    }

    const potentialTargets = AttackSystem.getAttackCounterTargets(gameContext, entity);

    if(potentialTargets.length === 0) {
        return null;
    }

    //TODO: Pick a target based on ai -> damage dealt, or guarantee kill.
    const targetID = potentialTargets[0];
    const target = entityManager.getEntity(targetID);

    const damage = AttackSystem.getDamage(gameContext, target, [entityID]);
    const state = AttackSystem.getOutcomeState(gameContext, damage, target, [entityID]);
    
    return {
        "targetID": targetID,
        "attackers": [entityID],
        "damage": damage,
        "state": state
    }
}

CounterAttackAction.prototype.getTemplate = function(entityID, attackers) {
    return {
        "entityID": entityID,
        "attackers": attackers
    }
}