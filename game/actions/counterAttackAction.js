import { Action } from "../../source/action/action.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterAttackAction = function() {}

CounterAttackAction.prototype = Object.create(Action.prototype);
CounterAttackAction.prototype.constructor = CounterAttackAction;

CounterAttackAction.prototype.onStart = function(gameContext, request, messengerID) {
    AttackSystem.beginAttack(gameContext, request);
}

CounterAttackAction.prototype.onEnd = function(gameContext, request, messengerID) {
    AttackSystem.endAttack(gameContext, request, messengerID);
}

CounterAttackAction.prototype.onUpdate = function(gameContext, request, messengerID) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

CounterAttackAction.prototype.isFinished = function(gameContext, request, messengerID) {
    const settings = gameContext.getConfig("Settings");
    const timeRequired = settings.hitDuration;

    return request.timePassed >= timeRequired;
}

CounterAttackAction.prototype.getValidated = function(gameContext, template, messengerID) {
    const { entityID, attackers } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const attackComponent = entity.getComponent(ArmyEntity.COMPONENT.ATTACK);
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);

    if(!attackComponent || !attackComponent.isAttackCounterable() || !healthComponent.isAlive()) {
        return null;
    }

    const potentialTargets = AttackSystem.getAttackCounterTargets(gameContext, entity);

    if(potentialTargets.length === 0) {
        return null;
    }

    //TODO: Pick a target based on ai -> damage dealt, or guarantee kill.
    const pickedTarget = AttackSystem.pickAttackCounterTarget(entity, potentialTargets);
    const outcome = AttackSystem.getOutcome(pickedTarget, [entity]);

    return {
        "timePassed": 0,
        "state": outcome.state,
        "damage": outcome.damage,
        "attackers": outcome.attackers,
        "targetID": outcome.targetID
    }
}

CounterAttackAction.prototype.getTemplate = function(entityID, attackers) {
    return {
        "entityID": entityID,
        "attackers": attackers
    }
}