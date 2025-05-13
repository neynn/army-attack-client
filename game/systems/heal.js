import { Inventory } from "../actors/player/inventory/inventory.js";
import { GameEvent } from "../gameEvent.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const HealSystem = function() {}

HealSystem.DEFAULT_HEAL_COST = 100;
HealSystem.HEAL_RESOURCE = "Supplies";

HealSystem.getSuppliesRequired = function(entity, missingHealth) {
    const costPerPoint = entity.config.healCost ?? HealSystem.DEFAULT_HEAL_COST;
    const supplyCost = missingHealth * costPerPoint;

    return supplyCost;
}

HealSystem.getMissingHealth = function(entity) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const missingHealth = healthComponent.getMissing();

    return missingHealth;
}

HealSystem.isEntityHealable = function(entity, actor) {
    const entityID = entity.getID();

    if(!actor.hasEntity(entityID)) {
        return false;
    }

    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const isFull = healthComponent.isFull();

    if(isFull) {
        return false;
    }

    return hasEnoughSupplies(entity, actor);
}

HealSystem.healEntity = function(gameContext, entity, health) {
    const { world } = gameContext;
    const { eventBus } = world;

    entity.addHealth(health);
    entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);

    eventBus.emit(GameEvent.TYPE.ENTITY_HEAL, { "entity": entity, "health": health });
}

HealSystem.takeSupplies = function(actor, cost) {
    const { inventory } = actor;

    if(!inventory) {
        return false;
    }

    inventory.remove(Inventory.TYPE.RESOURCE, HealSystem.HEAL_RESOURCE, cost);
}

const hasEnoughSupplies = function(entity, actor) {
    const missingHealth = HealSystem.getMissingHealth(entity);
    const requiredSupplies = HealSystem.getSuppliesRequired(entity, missingHealth);

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
