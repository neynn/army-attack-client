import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { CAMERAS, ENTITY_EVENTS, SYSTEM_TYPES } from "../enums.js";

export const MoveSystem = function(gameContext, entity) {
    const { timer, renderer } = gameContext;
    const camera = renderer.getCamera(CAMERAS.ARMY_CAMERA);
    const { width } = camera.getTileDimensions();
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);

    if(moveComponent.path.length !== 0) {
        const { deltaX, deltaY } = moveComponent.path[0];
        const moveSpeed = moveComponent.speed * deltaTime;

        positionComponent.positionX += deltaX * moveSpeed;
        positionComponent.positionY += deltaY * moveSpeed;

        moveComponent.distance += moveSpeed;

        while(moveComponent.distance >= width && moveComponent.path.length !== 0) {
            const {deltaX, deltaY} = moveComponent.path[0];
            const tileX = positionComponent.tileX + deltaX;
            const tileY = positionComponent.tileY + deltaY;
            const { x, y } = camera.transformTileToPositionCenter(tileX, tileY);
            
            positionComponent.positionX = x;
            positionComponent.positionY = y;
            positionComponent.tileX = tileX;
            positionComponent.tileY = tileY;

            moveComponent.distance -= width;
            moveComponent.path.shift();
        }
    }

    entity.events.emit(ENTITY_EVENTS.POSITION_UPDATE, positionComponent.positionX, positionComponent.positionY);
}

MoveSystem.isPathFinished = function(entity) {
    const moveComponent = entity.getComponent(MoveComponent);
    return moveComponent.path.length === 0;
}

MoveSystem.beginMove = function(gameContext, entity, path) {
    const { client, world } = gameContext;
    const { systemManager } = world;
    const { soundPlayer } = client;
    const moveComponent = entity.getComponent(MoveComponent);

    moveComponent.path = path;
    soundPlayer.playRandom(entity.config.sounds.move);
    systemManager.addEntity(SYSTEM_TYPES.MOVE, entity.id);
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { world, renderer } = gameContext;
    const { systemManager } = world;
    const camera = renderer.getCamera(CAMERAS.ARMY_CAMERA);
    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const { x, y } = camera.transformTileToPositionCenter(targetX, targetY);

    positionComponent.positionX = x;
    positionComponent.positionY = y;
    positionComponent.tileX = targetX;
    positionComponent.tileY = targetY;

    moveComponent.distance = 0;
    moveComponent.path = [];

    entity.events.emit(ENTITY_EVENTS.POSITION_UPDATE, positionComponent.positionX, positionComponent.positionY);
    systemManager.removeEntity(SYSTEM_TYPES.MOVE, entity.id);
}