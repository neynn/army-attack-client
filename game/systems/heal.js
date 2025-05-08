import { Inventory } from "../actors/player/inventory/inventory.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const HealSystem = function() {}

HealSystem.HEAL_RESOURCE = "Supplies";

HealSystem.getSuppliesRequired = function(entity) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const missingHealth = healthComponent.getMissing();
    const costPerPoint = entity.config.healCost ?? 0;
    const supplyCost = missingHealth * costPerPoint;

    return supplyCost;
}

HealSystem.hasEnoughSupplies = function(entiy, actor) {
    const requiredSupplies = HealSystem.getSuppliesRequired(entiy);

    if(requiredSupplies === 0) {
        return true;
    }

    const { inventory } = actor;

    if(!inventory) {
        return false;
    }

    const hasEnough = inventory.has(Inventory.TYPE.RESOURCE, HealSystem.HEAL_RESOURCE, requiredSupplies);
    
    return hasEnough;
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

    if(isFull) {
        return false;
    }

    const hasEnoughSupplies = HealSystem.hasEnoughSupplies(entity, actor);

    return hasEnoughSupplies;
}