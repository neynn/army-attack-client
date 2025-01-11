import { Action } from "../../source/action/action.js";

import { DirectionSystem } from "../systems/direction.js";
import { MoveSystem } from "../systems/move.js";
import { PathfinderSystem } from "../systems/pathfinder.js";
import { MorphSystem } from "../systems/morph.js";
import { PlaceSystem } from "../systems/place.js";
import { ConquerSystem } from "../systems/conquer.js";
import { MoveComponent } from "../components/move.js";
import { HealthComponent } from "../components/health.js";
import { ACTION_TYPES } from "../enums.js";

export const MoveAction = function() {}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, request) {
    const { targetX, targetY, entityID, path } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    DirectionSystem.lookAtTile(entity, targetX, targetY);    
    MoveSystem.beginMove(gameContext, entity, path);
    MorphSystem.toMove(gameContext, entity);
    PlaceSystem.removeEntity(gameContext, entity);
}

MoveAction.prototype.onEnd = function(gameContext, request) {
    const { targetX, targetY, entityID } = request;
    const { world } = gameContext;
    const { entityManager, actionQueue } = world;
    const entity = entityManager.getEntity(entityID);

    ConquerSystem.conquerTile(gameContext, targetX, targetY, entity);
    MoveSystem.endMove(gameContext, entity, targetX, targetY);
    MorphSystem.toIdle(gameContext, entity);
    PlaceSystem.placeEntity(gameContext, entity);
    actionQueue.addRequest(actionQueue.createRequest(ACTION_TYPES.COUNTER_MOVE, entityID));
}

MoveAction.prototype.onUpdate = function(gameContext, request) {
    const { entityID } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    MoveSystem.updatePath(gameContext, entity);
}

MoveAction.prototype.isFinished = function(gameContext, request) {
    const { entityID } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);
    const moveComponent = entity.getComponent(MoveComponent);

    return moveComponent.isPathEmpty();
}

MoveAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { entityID, targetX, targetY } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity) {
        return null;
    }
    
    const healthComponent = entity.getComponent(HealthComponent);
    const isTileFree = PathfinderSystem.isTileFree(gameContext, targetX, targetY);

    if(!healthComponent.isAlive() || !isTileFree) {
        return null;
    }

    const nodeList = PathfinderSystem.generateNodeList(gameContext, entity);
    const path = PathfinderSystem.generateMovePath(nodeList, targetX, targetY);

    if(path.length === 0) {
        return null;
    }

    return {
        "entityID": entityID,
        "targetX": targetX,
        "targetY": targetY,
        "path": path
    }
}

MoveAction.prototype.getTemplate = function(entityID, targetX, targetY) {
    return {
        "entityID": entityID,
        "targetX": targetX,
        "targetY": targetY
    }
}