import { CAMERA_TYPES } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";

export const MoveSystem = function() {}

MoveSystem.updatePath = function(gameContext, entity) {
    const { timer, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const { width } = camera.getTileDimensions();
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    if(!moveComponent.isPathEmpty()) {
        const { deltaX, deltaY, speed } = moveComponent.getCurrentStep();
        const moveSpeed = moveComponent.speed * deltaTime / speed;
        
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
    }

    MoveSystem.updateSpritePosition(gameContext, entity);
}

MoveSystem.updateSpritePosition = function(gameContext, entity) {
    const spriteComponent = entity.getComponent(ArmyEntity.COMPONENT.SPRITE);
    const positionComponent = entity.getComponent(ArmyEntity.COMPONENT.POSITION);
    const { positionX, positionY } = positionComponent;

    spriteComponent.setPosition(gameContext, positionX, positionY);
}

MoveSystem.beginMove = function(gameContext, entity, path) {
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    moveComponent.path = path;
    
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.MOVE);
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
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