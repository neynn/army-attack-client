import { Action } from "../../source/action/action.js";
import { AnimationSystem } from "../systems/animation.js";
import { DebrisSystem } from "../systems/debris.js";

export const ClearDebrisAction = function() {}

ClearDebrisAction.prototype = Object.create(Action.prototype);
ClearDebrisAction.prototype.constructor = ClearDebrisAction;

ClearDebrisAction.prototype.onStart = function(gameContext, request) {
    const { tileX, tileY } = request;

    AnimationSystem.playCleaning(gameContext, tileX, tileY);
}

ClearDebrisAction.prototype.onEnd = function(gameContext, request) {
    const { tileX, tileY, cleanerID } = request;

    DebrisSystem.endCleaning(gameContext, tileX, tileY, cleanerID);
}

ClearDebrisAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

ClearDebrisAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.iconDuration;

    return request.timePassed >= timeRequired;
}

ClearDebrisAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return null;
    }

    const { tileX, tileY } = request;
    const hasDebris = worldMap.hasDebris(tileX, tileY);

    if(!hasDebris) {
        return null;
    }

    return {
        "timePassed": 0,
        "tileX": tileX,
        "tileY": tileY,
        "cleanerID": messengerID,
    }
}

ClearDebrisAction.prototype.getTemplate = function(tileX, tileY) {
    return {
        "tileX": tileX,
        "tileY": tileY
    }
}