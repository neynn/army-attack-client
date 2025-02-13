import { clampValue } from "../../source/math/math.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const HealthSystem = function() {}

HealthSystem.toMax = function(entity) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    
    healthComponent.health = healthComponent.maxHealth;
    entity.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

HealthSystem.setHealth = function(entity, value) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const newHealth = clampValue(value, healthComponent.maxHealth, 0);

    healthComponent.health = newHealth;
    entity.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}

HealthSystem.reduceHealth = function(entity, value) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const remainingHealth = clampValue(healthComponent.health - value, healthComponent.maxHealth, 0);

    healthComponent.health = remainingHealth;
    entity.events.emit(ArmyEntity.EVENT.HEALTH_UPDATE, healthComponent.health, healthComponent.maxHealth);
}