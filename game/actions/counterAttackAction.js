import { Action } from "../../source/action/action.js";
import { CounterComponent } from "../components/counter.js";
import { HealthComponent } from "../components/health.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";
import { DeathSystem } from "../systems/death.js";
import { DecaySystem } from "../systems/decay.js";
import { HealthSystem } from "../systems/health.js";
import { MorphSystem } from "../systems/morph.js";

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
    HealthSystem.reduceHealth(target, damage);

    if(state === AttackSystem.OUTCOME_STATE.DOWN) {
        DecaySystem.beginDecay(gameContext, target);
    } else {
        MorphSystem.toHit(gameContext, target);
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
        DeathSystem.destroyEntity(gameContext, targetID);
    } else if(state === AttackSystem.OUTCOME_STATE.IDLE) {
        MorphSystem.toIdle(gameContext, target);
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