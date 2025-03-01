import { ArmyEntity } from "../init/armyEntity.js";
import { Player } from "../player/player.js";

export const MoveSystem = function() {}

MoveSystem.updatePath = function(gameContext, entity) {
    const { timer, renderer } = gameContext;
    const camera = renderer.getContext(Player.CAMERA_ID).getCamera();
    const { width } = camera.getTileDimensions();
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(moveComponent.isPathEmpty()) {
        return;
    }

    const { deltaX, deltaY, speed } = moveComponent.getCurrentStep();
    const moveSpeed = (moveComponent.speed / speed) * deltaTime;
    
    positionComponent.updatePosition(deltaX * moveSpeed, deltaY * moveSpeed);
    moveComponent.distance += moveSpeed;

    while(moveComponent.distance >= width && !moveComponent.isPathEmpty()) {
        const { deltaX, deltaY } = moveComponent.getCurrentStep();
        const tileX = positionComponent.tileX + deltaX;
        const tileY = positionComponent.tileY + deltaY;
        const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);
        
        positionComponent.setPosition(x, y);
        positionComponent.setTile(tileX, tileY);
        moveComponent.distance -= width;
        moveComponent.path.pop();
    }

    MoveSystem.updateSpritePosition(gameContext, entity);
}

MoveSystem.updateSpritePosition = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { positionX, positionY } = positionComponent;

    spriteComponent.setPosition(gameContext, positionX, positionY);
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
    moveComponent.clear();

    MoveSystem.updateSpritePosition(gameContext, entity);
}