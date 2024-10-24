import { HealthComponent } from "../components/health.js";
import { ENTITY_EVENTS } from "../enums.js";

export const HealthSystem = function() {}

HealthSystem.isAlive = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);

    return healthComponent.health !== 0;
}

HealthSystem.wouldDie = function(entity, damage) {
    const healthComponent = entity.getComponent(HealthComponent);
    const remainingHealth = healthComponent.health - damage;

    return remainingHealth <= 0;
}

HealthSystem.reduceHealth = function(entity, value) {
    const healthComponent = entity.getComponent(HealthComponent);
    const remainingHealth = healthComponent.health - value;

    if(remainingHealth < 0) {
        healthComponent.health = 0;
    } else {
        healthComponent.health = remainingHealth;
    }

    entity.events.emit(ENTITY_EVENTS.STAT_UPDATE);
}