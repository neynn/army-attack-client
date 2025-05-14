import { ArmyEntity } from "../init/armyEntity.js";
import { Player } from "../actors/player/player.js";

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

    const { timer, renderer } = gameContext;
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const deltaTime = timer.getFixedDeltaTime();
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const deltaDistance = moveComponent.updateDistance(deltaTime);
    const { deltaX, deltaY } = moveComponent.getCurrentStep();

    positionComponent.updatePosition(deltaX * deltaDistance, deltaY * deltaDistance);

    while(moveComponent.isPathAdvanceRequired(gameContext.settings.travelDistance)) {
        const { deltaX, deltaY } = moveComponent.getCurrentStep();
        const tileX = positionComponent.tileX + deltaX;
        const tileY = positionComponent.tileY + deltaY;
        const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);
        
        positionComponent.setPosition(x, y);
        positionComponent.setTile(tileX, tileY);
        moveComponent.advancePath(gameContext.settings.travelDistance);
    }

    updateSpritePosition(gameContext, entity);
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { renderer } = gameContext;
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(camera) {
        const { x, y } = camera.transformTileToPositionCenter(targetX, targetY);
        
        positionComponent.setPosition(x, y);
    }

    positionComponent.setTile(targetX, targetY);
    moveComponent.clearPath();

    updateSpritePosition(gameContext, entity);
}