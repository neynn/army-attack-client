import { MoveComponent } from "../components/move.js";
import { PositionComponent } from "../components/position.js";
import { ENTITY_EVENTS } from "../enums.js";
import { tileToPosition_center } from "../source/camera/helpers.js";

export const MoveSystem = function() {}

MoveSystem.isPathFinished = function(entity) {
    const moveComponent = entity.getComponent(MoveComponent);
    return moveComponent.path.length === 0;
}

MoveSystem.updatePath = function(gameContext, entity) {
    const {timer} = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);

    if(moveComponent.path.length !== 0) {
        const {deltaX, deltaY} = moveComponent.path[0];
        const moveSpeed = moveComponent.speed * deltaTime;

        positionComponent.positionX += deltaX * moveSpeed;
        positionComponent.positionY += deltaY * moveSpeed;

        moveComponent.distance += moveSpeed;

        while(moveComponent.distance >= moveComponent.maxDistance && moveComponent.path.length !== 0) {
            const {deltaX, deltaY} = moveComponent.path[0];
            const tileX = positionComponent.tileX + deltaX;
            const tileY = positionComponent.tileY + deltaY;
            const {x, y} = tileToPosition_center(tileX, tileY);
            
            positionComponent.positionX = x;
            positionComponent.positionY = y;
            positionComponent.tileX = tileX;
            positionComponent.tileY = tileY;

            moveComponent.distance -= moveComponent.maxDistance;
            moveComponent.path.shift();
        }
    }

    entity.events.emit(ENTITY_EVENTS.POSITION_UPDATE);
}

MoveSystem.beginMove = function(gameContext, entity, path) {
    const { client } = gameContext;
    const { soundPlayer } = client;
    const moveComponent = entity.getComponent(MoveComponent);

    soundPlayer.playRandom(entity.config.sounds.move);
    moveComponent.path = path;
}

MoveSystem.endMove = function(gameContext, entity, targetX, targetY) {
    const positionComponent = entity.getComponent(PositionComponent);
    const moveComponent = entity.getComponent(MoveComponent);
    const {x, y} = tileToPosition_center(targetX, targetY);

    positionComponent.positionX = x;
    positionComponent.positionY = y;
    positionComponent.tileX = targetX;
    positionComponent.tileY = targetY;

    moveComponent.distance = 0;
    moveComponent.path = [];

    entity.events.emit(ENTITY_EVENTS.POSITION_UPDATE);
}