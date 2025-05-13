import { Action } from "../../source/action/action.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterAttackAction = function() {
    Action.call(this);

    this.priority = Action.PRIORITY.HIGH;
}

CounterAttackAction.prototype = Object.create(Action.prototype);
CounterAttackAction.prototype.constructor = CounterAttackAction;

CounterAttackAction.prototype.onStart = function(gameContext, request) {
    const { attackers, target } = request;

    AttackSystem.updateTarget(gameContext, target);
    AnimationSystem.playFire(gameContext, target, attackers);
}

CounterAttackAction.prototype.onEnd = function(gameContext, request) {
    const { attackers, target } = request;

    AttackSystem.endAttack(gameContext, target, attackers);
    AnimationSystem.playIdle(gameContext, attackers);
}

CounterAttackAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

CounterAttackAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

CounterAttackAction.prototype.getValidated = function(gameContext, template, messengerID) {
    const { entityID } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }

    const isAttackCounterable = AttackSystem.isAttackCounterable(entity);

    if(!isAttackCounterable) {
        return null;
    }

    const potentialTargets = AttackSystem.getAttackCounterTargets(gameContext, entity);

    if(!potentialTargets) {
        return null;
    }

    //TODO: Pick a target based on ai -> damage dealt, or guarantee kill.
    const pickedTarget = AttackSystem.pickAttackCounterTarget(entity, potentialTargets);
    const attackerIDs = [entity].map(entity => entity.getID());
    const targetObject = AttackSystem.getAttackTarget(pickedTarget, [entity]);
    
    return {
        "timePassed": 0,
        "attackers": attackerIDs,
        "target": targetObject
    }
}

CounterAttackAction.prototype.getTemplate = function(entityID, attackers) {
    return {
        "entityID": entityID,
        "attackers": attackers
    }
}