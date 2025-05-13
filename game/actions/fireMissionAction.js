import { Action } from "../../source/action/action.js";
import { FireMissionSystem } from "../systems/fireMission.js";

export const FireMissionAction = function() {
    Action.call(this);
}

FireMissionAction.prototype = Object.create(Action.prototype);
FireMissionAction.prototype.constructor = FireMissionAction;

FireMissionAction.prototype.onStart = function(gameContext, request) {
    const { callID, tileX, tileY, targets } = request;

    FireMissionSystem.startFireMission(gameContext, callID, tileX, tileY, targets);
}

FireMissionAction.prototype.onEnd = function(gameContext, request) {
    const { callID, tileX, tileY, targets } = request;

    FireMissionSystem.endFireMission(gameContext, callID, tileX, tileY, targets);
}

FireMissionAction.prototype.onUpdate = function(gameContext, request) {
    const { timer } = gameContext;
    const deltaTime = timer.getFixedDeltaTime();

    request.timePassed += deltaTime;
}

FireMissionAction.prototype.isFinished = function(gameContext, request) {
    const timeRequired = gameContext.settings.hitDuration;

    //Fire Animations have no animation as of yet, so return true immediately.
    return true || request.timePassed >= timeRequired;
}

FireMissionAction.prototype.getValidated = function(gameContext, request) {
    const { callID, tileX, tileY } = request;
    const fireMission = FireMissionSystem.getType(gameContext, callID);

    if(!fireMission) {
        return null;
    }

    const isBlocked = FireMissionSystem.isBlocked(gameContext, fireMission, tileX, tileY);

    if(isBlocked) {
        return null;
    }

    const targets = FireMissionSystem.getTargets(gameContext, fireMission, tileX, tileY);

    return {
        "callID": callID,
        "tileX": tileX,
        "tileY": tileY,
        "targets": targets,
        "timePassed": 0
    }
}

FireMissionAction.prototype.getTemplate = function(actorID, callID, tileX, tileY) {
    return {
        "actorID": actorID,
        "callID": callID,
        "tileX": tileX,
        "tileY": tileY
    }
}