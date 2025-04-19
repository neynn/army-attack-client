import { ArmyEntity } from "../init/armyEntity.js";

export const LookSystem = function() {}

LookSystem.lookHorizontal = function(entity, westCondition) {
    const directionComponent = entity.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(westCondition) {
        directionComponent.toWest();
    } else {
        directionComponent.toEast();
    }
}

LookSystem.lookVertical = function(entity, northCondition) {
    const directionComponent = entity.getComponent(ArmyEntity.COMPONENT.DIRECTION);

    if(northCondition) {
        directionComponent.toNorth();
    } else {
        directionComponent.toSouth();
    }
}

LookSystem.lookAtEntity = function(entity, target) {
    const targetPosition = target.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { tileX, tileY } = targetPosition;

    LookSystem.lookAtTile(entity, tileX, tileY);
}

LookSystem.lookAtTile = function(entity, targetX, targetY) {
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { tileX, tileY } = positionComponent;

    if(targetX === tileX) {
        LookSystem.lookVertical(entity, targetY < tileY);
    } else {
        LookSystem.lookHorizontal(entity, targetX < tileX);
        LookSystem.lookVertical(entity, targetY < tileY);
    }
}