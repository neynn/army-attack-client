import { Action } from "../../source/action/action.js";
import { MoveSystem } from "../systems/move.js";
import { PathfinderSystem } from "../systems/pathfinder.js";
import { ACTION_TYPE } from "../enums.js";
import { ArmyEntity } from "../init/armyEntity.js";
import { ConquerSystem } from "../systems/conquer.js";
import { MapSystem } from "../systems/map.js";
import { LookSystem } from "../systems/look.js";

export const MoveAction = function() {}

MoveAction.prototype = Object.create(Action.prototype);
MoveAction.prototype.constructor = MoveAction;

MoveAction.prototype.onStart = function(gameContext, request) {
    const { targetX, targetY, entityID, path } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    moveComponent.setPath(path);
    entity.playSound(gameContext, ArmyEntity.SOUND_TYPE.MOVE);
    LookSystem.lookAtTile(entity, targetX, targetY);
    entity.updateSpriteDirectonal(gameContext, ArmyEntity.SPRITE_TYPE.MOVE, ArmyEntity.SPRITE_TYPE.MOVE_UP);
    MapSystem.removeEntity(gameContext, entity);
}

MoveAction.prototype.onEnd = function(gameContext, request) {
    const { targetX, targetY, entityID } = request;
    const { world } = gameContext;
    const { entityManager, actionQueue } = world;
    const entity = entityManager.getEntity(entityID);

    MoveSystem.endMove(gameContext, entity, targetX, targetY);
    entity.updateSprite(gameContext, ArmyEntity.SPRITE_TYPE.IDLE);
    MapSystem.placeEntity(gameContext, entity);
    ConquerSystem.tryConquering(gameContext, entity, targetX, targetY);
    actionQueue.addImmediateRequest(ACTION_TYPE.COUNTER_MOVE, null, entityID);
}

MoveAction.prototype.isFinished = function(gameContext, request) {
    const { entityID } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);
    const moveComponent = entity.getComponent(ArmyEntity.COMPONENT.MOVE);

    return moveComponent.isPathEmpty();
}

MoveAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { entityID, targetX, targetY } = request;
    const { world } = gameContext;
    const { entityManager } = world;
    const entity = entityManager.getEntity(entityID);

    if(!entity || !entity.isAlive()) {
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