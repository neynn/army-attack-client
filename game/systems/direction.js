import { DirectionComponent } from "../components/direction.js";
import { PositionComponent } from "../components/position.js";

export const DirectionSystem = function() {}

DirectionSystem.changeDirection = function(entity, directionX, directionY) {
    const directionComponent = entity.getComponent(DirectionComponent);

    if(directionX !== null) {
        directionComponent.directionX = directionX;
    }

    if(directionY !== null) {
        directionComponent.directionY = directionY;
    }
}

DirectionSystem.lookHorizontal = function(entity, westCondition) {
    const directionComponent = entity.getComponent(DirectionComponent);

    if(westCondition) {
        directionComponent.directionX = DirectionComponent.DIRECTION_WEST;
    } else {
        directionComponent.directionX = DirectionComponent.DIRECTION_EAST;
    }
}

DirectionSystem.lookVertical = function(entity, northCondition) {
    const directionComponent = entity.getComponent(DirectionComponent);

    if(northCondition) {
        directionComponent.directionY = DirectionComponent.DIRECTION_NORTH;
    } else {
        directionComponent.directionY = DirectionComponent.DIRECTION_SOUTH;
    }
}

DirectionSystem.lookTo = function(entity, westCondition, northCondition) {
    const directionComponent = entity.getComponent(DirectionComponent);
    
    if(westCondition) {
        directionComponent.directionX = DirectionComponent.DIRECTION_WEST;
    } else {
        directionComponent.directionX = DirectionComponent.DIRECTION_EAST;
    }

    if(northCondition) {
        directionComponent.directionY = DirectionComponent.DIRECTION_NORTH;
    } else {
        directionComponent.directionY = DirectionComponent.DIRECTION_SOUTH;
    }
}

DirectionSystem.lookAt = function(entity, target) {
    const positionComponent = entity.getComponent(PositionComponent);
    const targetPosition = target.getComponent(PositionComponent);

    if(targetPosition.tileX === positionComponent.tileX) {
        DirectionSystem.lookVertical(entity, targetPosition.tileY < positionComponent.tileY);
    } else {
        DirectionSystem.lookTo(entity, targetPosition.tileX < positionComponent.tileX, targetPosition.tileY < positionComponent.tileY);
    }
}

DirectionSystem.lookAtTile = function(entity, targetX, targetY) {
    const positionComponent = entity.getComponent(PositionComponent);
    const { tileX, tileY } = positionComponent;

    if(targetX === tileX) {
        DirectionSystem.lookVertical(entity, targetY < tileY);
    } else {
        DirectionSystem.lookTo(entity, targetX < tileX, targetY < tileY);
    }
}