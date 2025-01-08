import { clampValue } from "../../source/math/math.js";

import { HealthComponent } from "../components/health.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const HealthSystem = function() {}

HealthSystem.isAlive = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);

    return healthComponent.health !== 0;
}

HealthSystem.getRemainingHealth = function(entity, damage) {
    const healthComponent = entity.getComponent(HealthComponent);
    const remainingHealth = clampValue(healthComponent.health - damage, healthComponent.maxHealth, 0);

    return remainingHealth;
}

HealthSystem.toMax = function(entity) {
    const healthComponent = entity.getComponent(HealthComponent);
    
    healthComponent.health = healthComponent.maxHealth;
    entity.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

HealthSystem.setHealth = function(entity, value) {
    const healthComponent = entity.getComponent(HealthComponent);
    const newHealth = clampValue(value, healthComponent.maxHealth, 0);

    healthComponent.health = newHealth;
    entity.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

HealthSystem.reduceHealth = function(entity, value) {
    const healthComponent = entity.getComponent(HealthComponent);
    const remainingHealth = clampValue(healthComponent.health - value, healthComponent.maxHealth, 0);

    healthComponent.health = remainingHealth;
    entity.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}