import { ArmyEventHandler } from "../armyEventHandler.js";
import { EntityHealEvent } from "../events/entityHeal.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { InventorySystem } from "./inventory.js";

/**
 * Collection of functions revolving around the healing of entities.
 */
export const HealSystem = function() {}

HealSystem.DEFAULT_HEAL_COST = 100;
HealSystem.HEAL_RESOURCE = "Supplies";

/**
 * Returns the heal cost of an entity based on its missing health.
 * 
 * @param {*} entity 
 * @param {int} missingHealth 
 * @returns {int}
 */
HealSystem.getSuppliesRequired = function(entity, missingHealth) {
    const costPerPoint = entity.config.healCost ?? HealSystem.DEFAULT_HEAL_COST;
    const supplyCost = missingHealth * costPerPoint;

    return supplyCost;
}

/**
 * Returns the missing health of an entity.
 * 
 * @param {*} entity 
 * @returns {int}
 */
HealSystem.getMissingHealth = function(entity) {
    const healthComponent = entity.getComponent(ArmyEntity.COMPONENT.HEALTH);
    const missingHealth = healthComponent.getMissing();

    return missingHealth;
}

/**
 * Checks if an entity can be healed by an actor. The actor needs to own the entity and have enough resources.
 * 
 * @param {*} entity 
 * @param {*} actor 
 * @returns {boolean} 
 */
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

    const missingHealth = HealSystem.getMissingHealth(entity);
    const requiredSupplies = HealSystem.getSuppliesRequired(entity, missingHealth);

    return InventorySystem.hasEnoughResources(actor, HealSystem.HEAL_RESOURCE, requiredSupplies);
}

/**
 * Heals an entity for the specified amount and emits the ENTITY_HEAL event.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 * @param {int} health 
 */
HealSystem.healEntity = function(gameContext, entity, health) {
    const { world } = gameContext;
    const { eventBus } = world;

    entity.addHealth(health);
    entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);

    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_HEAL, EntityHealEvent.createEvent(entity.getID(), health));
}