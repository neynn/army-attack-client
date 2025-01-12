import { Action } from "../../source/action/action.js";
import { CounterComponent } from "../components/counter.js";
import { HealthComponent } from "../components/health.js";

export const CounterAttackAction = function() {
    this.timePassed = 0;
}

CounterAttackAction.prototype = Object.create(Action.prototype);
CounterAttackAction.prototype.constructor = CounterAttackAction;

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

    const counterComponent = entity.getComponent(CounterComponent);
    const healthComponent = entity.getComponent(HealthComponent);

    if(!counterComponent || !counterComponent.isAttackCounterable() || !healthComponent.isAlive()) {
        return null;
    }

    const targetID = null;

    return {
        "entityID": entityID,
        "damage": 0,
        "state": 0,
        "target": null
    }
}

CounterAttackAction.prototype.getTemplate = function(entityID, attackers) {
    return {
        "entityID": entityID,
        "attackers": attackers
    }
}