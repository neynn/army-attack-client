import { Action } from "../../source/action/action.js";
import { AnimationSystem } from "../systems/animation.js";
import { AttackSystem } from "../systems/attack.js";

export const CounterMoveAction = function() {
    Action.call(this);

    this.priority = Action.PRIORITY.HIGH;
}

CounterMoveAction.prototype = Object.create(Action.prototype);
CounterMoveAction.prototype.constructor = CounterMoveAction;

CounterMoveAction.prototype.onStart = function(gameContext, request) {
    const { attackers, target } = request;

    AttackSystem.updateTarget(gameContext, target);
    AnimationSystem.playFire(gameContext, target, attackers);
}

CounterMoveAction.prototype.onEnd = function(gameContext, request) {
    const { attackers, target } = request;
    
    AttackSystem.endAttack(gameContext, target, attackers);
    AnimationSystem.playIdle(gameContext, attackers);
}

CounterMoveAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

CounterMoveAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    return request.timePassed >= timeRequired;
}

CounterMoveAction.prototype.getValidated = function(gameContext, template) {
    const { entityID } = template;
    const { world } = gameContext; 
    const { entityManager } = world;
    const target = entityManager.getEntity(entityID);

    if(!target) {
        return null;
    }

    const attackers = AttackSystem.getMoveCounterAttackers(gameContext, target);

    if(!attackers) {
        return null;
    }
    
    const attackerIDs = attackers.map(entity => entity.getID());
    const targetObject = AttackSystem.getAttackTarget(target, attackers);
    
    return {
        "timePassed": 0,
        "attackers": attackerIDs,
        "target": targetObject
    }
}

CounterMoveAction.prototype.getTemplate = function(entityID) {
    return {
        "entityID": entityID
    }
}