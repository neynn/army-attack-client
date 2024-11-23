import { HealthComponent } from "../components/health.js";
import { ENTITY_EVENTS } from "../enums.js";

export const HealthSystem = function() {}

HealthSystem.isAlive = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);

    return healthComponent.health !== 0;
}

HealthSystem.getRemainingHealth = function(entity, damage) {
    const healthComponent = entity.getComponent(HealthComponent);
    const remainingHealth = healthComponent.health - damage;

    if(remainingHealth < 0) {
        return 0;
    }

    return remainingHealth;
}

HealthSystem.toMax = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);
    
    healthComponent.health = healthComponent.maxHealth;

    entity.events.emit(ENTITY_EVENTS.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

HealthSystem.setHealth = function(entity, value) {
    const healthComponent = entity.getComponent(HealthComponent);

    if(value < 0) {
        healthComponent.health = 0;
    }  else {
        healthComponent.health = value;
    }

    entity.events.emit(ENTITY_EVENTS.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

HealthSystem.reduceHealth = function(entity, value) {
    const healthComponent = entity.getComponent(HealthComponent);
    const remainingHealth = healthComponent.health - value;

    if(remainingHealth < 0) {
        healthComponent.health = 0;
    } else {
        healthComponent.health = remainingHealth;
    }

    entity.events.emit(ENTITY_EVENTS.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}