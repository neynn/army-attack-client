import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { CAMERA_TYPES } from "../enums.js";
import { SpriteSystem } from "./sprite.js";

export const MoveSystem = function() {}

MoveSystem.updatePath = function(gameContext, entity) {
    const { timer, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const { width } = camera.getTileDimensions();
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);

    if(!moveComponent.isPathEmpty()) {
        const { deltaX, deltaY, speed } = moveComponent.getCurrentStep();
        const moveSpeed = moveComponent.speed * deltaTime / speed;

        positionComponent.positionX += deltaX * moveSpeed;
        positionComponent.positionY += deltaY * moveSpeed;

        moveComponent.distance += moveSpeed;

        while(moveComponent.distance >= width && !moveComponent.isPathEmpty()) {
            const { deltaX, deltaY } = moveComponent.getCurrentStep();
            const tileX = positionComponent.tileX + deltaX;
            const tileY = positionComponent.tileY + deltaY;
            const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);
            
            positionComponent.positionX = x;
            positionComponent.positionY = y;
            positionComponent.tileX = tileX;
            positionComponent.tileY = tileY;

            moveComponent.distance -= width;
            moveComponent.path.pop();
        }
    }

    SpriteSystem.alignSpritePosition(gameContext, entity);
}

MoveSystem.beginMove = function(gameContext, entity, path) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const moveComponent = entity.getComponent(MoveComponent);

    moveComponent.path = path;
    soundPlayer.playRandom(entity.config.sounds.move);
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { renderer } = gameContext;
    const camera = renderer.getCamera(CAMERA_TYPES.ARMY_CAMERA);
    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const { x, y } = camera.transformTileToPositionCenter(targetX, targetY);

    positionComponent.positionX = x;
    positionComponent.positionY = y;
    positionComponent.tileX = targetX;
    positionComponent.tileY = targetY;

    moveComponent.clear();

    SpriteSystem.alignSpritePosition(gameContext, entity);
}