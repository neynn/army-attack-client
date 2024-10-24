import { Action } from "../source/action/action.js";
import { DirectionSystem } from "../systems/direction.js";
import { MoveSystem } from "../systems/move.js";
import { PathfinderSystem } from "../systems/pathfinder.js";
import { ACTION_TYPES } from "../enums.js";
import { MorphSystem } from "../systems/morph.js";
import { PlaceSystem } from "../systems/place.js";

export const MoveAction = function() {
    Action.call(this);
    this.id = ACTION_TYPES.MOVE;
}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, request) {
    const { targetX, targetY, entityID, path } = request;
    const { entityManager } = gameContext;
    const entity = entityManager.getEntity(entityID);

    DirectionSystem.lookAtTile(entity, targetX, targetY);    
    MoveSystem.beginMove(gameContext, entity, path);
    MorphSystem.morphDirectional(entity, "move", "move_ne");
    PlaceSystem.removeEntity(gameContext, entity);
}

MoveAction.prototype.onEnd = function(gameContext, request) {
    const { targetX, targetY, entityID } = request;
    const { entityManager } = gameContext;
    const entity = entityManager.getEntity(entityID);

    MoveSystem.endMove(gameContext, entity, targetX, targetY);
    MorphSystem.updateSprite(entity, "idle");
    PlaceSystem.placeEntity(gameContext, entity);
}

MoveAction.prototype.onUpdate = function(gameContext, request) {
    const { entityID } = request;
    const { entityManager } = gameContext;
    const entity = entityManager.getEntity(entityID);

    MoveSystem.updatePath(gameContext, entity);

    return MoveSystem.isPathFinished(entity);
}

MoveAction.prototype.validate = function(gameContext, request) {
    const { entityID, targetX, targetY } = request;
    const { entityManager } = gameContext; 
    const targetEntity = entityManager.getEntity(entityID);

    if(!targetEntity) {
        return false;
    }

    const validTarget = PathfinderSystem.isEmpty(gameContext, targetX, targetY);

    if(!validTarget) {
        return false;
    }

    const nodeList = PathfinderSystem.generateNodeList(gameContext, targetEntity);
    const path = PathfinderSystem.getPath(nodeList, targetX, targetY);

    if(!path) {
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