import { DirectionComponent } from "../components/direction.js";
import { PositionComponent } from "../components/position.js";

export const DirectionSystem = function() {}

DirectionSystem.lookHorizontal = function(entity, westCondition) {
    const directionComponent = entity.getComponent(DirectionComponent);

    if(westCondition) {
        directionComponent.toWest();
    } else {
        directionComponent.toEast();
    }
}

DirectionSystem.lookVertical = function(entity, northCondition) {
    const directionComponent = entity.getComponent(DirectionComponent);

    if(northCondition) {
        directionComponent.toNorth();
    } else {
        directionComponent.toSouth();
    }
}

DirectionSystem.lookTo = function(entity, westCondition, northCondition) {
    const directionComponent = entity.getComponent(DirectionComponent);
    
    if(westCondition) {
        directionComponent.toWest();
    } else {
        directionComponent.toEast();
    }

    if(northCondition) {
        directionComponent.toNorth();
    } else {
        directionComponent.toSouth();
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