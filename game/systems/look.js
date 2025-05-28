import { ArmyEntity } from "../init/armyEntity.js";

/**
 * Collection of functions revolving around the looking direction of entities.
 */
export const LookSystem = function() {}

/**
 * Changes the horizontal direction of an entity is the condition is fulfilled.
 * 
 * @param {*} entity 
 * @param {boolean} westCondition 
 */
LookSystem.lookHorizontal = function(entity, westCondition) {
    const directionComponent = entity.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(westCondition) {
        directionComponent.toWest();
    } else {
        directionComponent.toEast();
    }
}

/**
 * Changes the vertical direction of an entity is the condition is fulfilled.
 * 
 * @param {*} entity 
 * @param {boolean} northCondition 
 */
LookSystem.lookVertical = function(entity, northCondition) {
    const directionComponent = entity.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(northCondition) {
        directionComponent.toNorth();
    } else {
        directionComponent.toSouth();
    }
}

/**
 * Makes the entity look at a target entity.
 * 
 * @param {*} entity 
 * @param {*} target 
 */
LookSystem.lookAtEntity = function(entity, target) {
    const targetPosition = target.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { tileX, tileY } = targetPosition;

    LookSystem.lookAtTarget(entity, tileX, tileY);
}

/**
 * Makes the entity look at a target position.
 * 
 * @param {*} entity 
 * @param {int} targetX 
 * @param {int} targetY 
 */
LookSystem.lookAtTarget = function(entity, targetX, targetY) {
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { tileX, tileY } = positionComponent;

    if(targetX === tileX) {
        LookSystem.lookVertical(entity, targetY < tileY);
    } else {
        LookSystem.lookHorizontal(entity, targetX < tileX);
        LookSystem.lookVertical(entity, targetY < tileY);
    }
}