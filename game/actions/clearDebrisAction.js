import { Action } from "../../source/action/action.js";
import { ActionRequest } from "../../source/action/actionRequest.js";
import { ACTION_TYPE } from "../enums.js";
import { AnimationSystem } from "../systems/animation.js";
import { DebrisSystem } from "../systems/debris.js";

export const ClearDebrisAction = function() {
    Action.call(this);
}

ClearDebrisAction.prototype = Object.create(Action.prototype);
ClearDebrisAction.prototype.constructor = ClearDebrisAction;

ClearDebrisAction.prototype.onStart = function(gameContext, request) {
    const { tileX, tileY } = request;

    AnimationSystem.playCleaning(gameContext, tileX, tileY);
}

ClearDebrisAction.prototype.onEnd = function(gameContext, request) {
    const { tileX, tileY, actorID } = request;

    DebrisSystem.endCleaning(gameContext, tileX, tileY, actorID);
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

ClearDebrisAction.prototype.getValidated = function(gameContext, request) {
    const { tileX, tileY, actorID } = request;
    const isCleanable = DebrisSystem.isCleanable(gameContext, tileX, tileY, actorID)

    if(!isCleanable) {
        return null;
    }

    return {
        "timePassed": 0,
        "tileX": tileX,
        "tileY": tileY,
        "actorID": actorID
    }
}

ClearDebrisAction.createRequest = function(actorID, tileX, tileY) {
    const request = new ActionRequest(ACTION_TYPE.CLEAR_DEBRIS, {
        "actorID": actorID,
        "tileX": tileX,
        "tileY": tileY
    });

    return request;
}