import { ArmyEntity } from "../init/armyEntity.js";

export const MoveSystem = function() {}

const updateSpritePosition = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { positionX, positionY } = positionComponent;

    spriteComponent.setPosition(gameContext, positionX, positionY);
}

MoveSystem.isMoveable = function(entity) {
    const isMoveable = entity.isAlive() && entity.hasComponent(ArmyEntity.COMPONENT.MOVE);

    return isMoveable;
}

MoveSystem.updatePath = function(gameContext, entity) {
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(moveComponent.isPathDone()) {
        return;
    }

    const { timer, transform2D } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const deltaDistance = moveComponent.updateDistance(deltaTime);
    const { deltaX, deltaY } = moveComponent.getCurrentStep();

    positionComponent.updatePosition(deltaX * deltaDistance, deltaY * deltaDistance);

    while(moveComponent.canPathAdvance(gameContext.settings.travelDistance)) {
        const { deltaX, deltaY } = moveComponent.getCurrentStep();
        const tileX = positionComponent.tileX + deltaX;
        const tileY = positionComponent.tileY + deltaY;
        const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);
        
        positionComponent.setPosition(x, y);
        positionComponent.setTile(tileX, tileY);
        moveComponent.advancePath(gameContext.settings.travelDistance);
    }

    updateSpritePosition(gameContext, entity);
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { transform2D } = gameContext;
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);
    const { x, y } = transform2D.transformTileToWorldCenter(targetX, targetY);
        
    positionComponent.setPosition(x, y);
    positionComponent.setTile(targetX, targetY);
    moveComponent.clearPath();

    updateSpritePosition(gameContext, entity);
}