import { Action } from "../../source/action/action.js";

import { DirectionSystem } from "../systems/direction.js";
import { MoveSystem } from "../systems/move.js";
import { PathfinderSystem } from "../systems/pathfinder.js";
import { ACTION_TYPES } from "../enums.js";
import { MorphSystem } from "../systems/morph.js";
import { PlaceSystem } from "../systems/place.js";
import { HealthSystem } from "../systems/health.js";

export const MoveAction = function() {
    Action.call(this);
}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, request) {
    const { targetX, targetY, entityID, path } = request;
    const { entityManager } = gameContext;
    const entity = entityManager.getEntity(entityID);

    DirectionSystem.lookAtTile(entity, targetX, targetY);    
    MoveSystem.beginMove(gameContext, entity, path);
    MorphSystem.toMove(entity);
    PlaceSystem.removeEntity(gameContext, entity);
}

MoveAction.prototype.onEnd = function(gameContext, request) {
    const { targetX, targetY, entityID } = request;
    const { entityManager, actionQueue } = gameContext;
    const entity = entityManager.getEntity(entityID);

    MoveSystem.endMove(gameContext, entity, targetX, targetY);
    MorphSystem.toIdle(entity);
    PlaceSystem.placeEntity(gameContext, entity);
}

MoveAction.prototype.isFinished = function(gameContext, request) {
    const { entityID } = request;
    const { entityManager } = gameContext;
    const entity = entityManager.getEntity(entityID);
    const isFinished = MoveSystem.isPathFinished(entity);

    return isFinished;
}

MoveAction.prototype.isValid = function(gameContext, request, messengerID) {
    const { entityID, targetX, targetY } = request;
    const { entityManager } = gameContext; 
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return false;
    }
    
    const isAlive = HealthSystem.isAlive(entity);
    const freeTile = PathfinderSystem.isTileFree(gameContext, targetX, targetY);

    if(!isAlive || !freeTile) {
        return false;
    }

    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const path = PathfinderSystem.generateMovePath(nodeList, targetX, targetY);

    if(path.length === 0) {
        return false;
    }

    request.path = path;

    return true;
}

export const createMoveRequest = function(entityID, targetX, targetY) {
    return {
        "entityID": entityID,
        "type": ACTION_TYPES.MOVE,
        "targetX": targetX,
        "targetY": targetY,
        "path": []
    }
}