import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { ENTITY_EVENTS, SYSTEM_TYPES } from "../enums.js";
import { Camera } from "../source/camera/camera.js";
import { tileToPosition_center } from "../source/camera/helpers.js";

export const MoveSystem = function(gameContext, entity) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);

    if(moveComponent.path.length !== 0) {
        const { deltaX, deltaY } = moveComponent.path[0];
        const moveSpeed = moveComponent.speed * deltaTime;

        positionComponent.positionX += deltaX * moveSpeed;
        positionComponent.positionY += deltaY * moveSpeed;

        moveComponent.distance += moveSpeed;

        while(moveComponent.distance >= Camera.TILE_WIDTH && moveComponent.path.length !== 0) {
            const {deltaX, deltaY} = moveComponent.path[0];
            const tileX = positionComponent.tileX + deltaX;
            const tileY = positionComponent.tileY + deltaY;
            const {x, y} = tileToPosition_center(tileX, tileY);
            
            positionComponent.positionX = x;
            positionComponent.positionY = y;
            positionComponent.tileX = tileX;
            positionComponent.tileY = tileY;

            moveComponent.distance -= Camera.TILE_WIDTH;
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
    const { client, systemManager } = gameContext;
    const { soundPlayer } = client;
    const moveComponent = entity.getComponent(MoveComponent);

    moveComponent.path = path;
    soundPlayer.playRandom(entity.config.sounds.move);
    systemManager.addEntity(SYSTEM_TYPES.MOVE, entity.id);
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const { systemManager } = gameContext;
    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const {x, y} = tileToPosition_center(targetX, targetY);

    positionComponent.positionX = x;
    positionComponent.positionY = y;
    positionComponent.tileX = targetX;
    positionComponent.tileY = targetY;

    moveComponent.distance = 0;
    moveComponent.path = [];

    entity.events.emit(ENTITY_EVENTS.POSITION_UPDATE, positionComponent.positionX, positionComponent.positionY);
    systemManager.removeEntity(SYSTEM_TYPES.MOVE, entity.id);
}