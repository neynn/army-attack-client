import { ArmyEntity } from "../init/armyEntity";

export const HealSystem = function() {}

HealSystem.getSuppliesRequired = function(entity) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const missingHealth = healthComponent.getMissing();
    const costPerPoint = entity.config.healCost ?? 50;
    const supplyCost = missingHealth * costPerPoint;

    return supplyCost;
}

HealSystem.isEntityHealable = function(gameContext, entityID, actorID) {
    const { world } = gameContext;
    const { turnManager, entityManager } = world;
    const actor = turnManager.getActor(actorID);

    if(!actor || !actor.hasEntity(entityID)) {
        return false;
    }

    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return false;
    }

    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isFull = healthComponent.isFull();

    return !isFull;
}