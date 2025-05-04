import { Action } from "../../source/action/action.js";
import { FireMissionSystem } from "../systems/fireMission.js";

export const FireMissionAction = function() {}

FireMissionAction.prototype = Object.create(Action.prototype);
FireMissionAction.prototype.constructor = FireMissionAction;

FireMissionAction.prototype.getValidated = function(gameContext, request, messengerID) {
    const { callID, tileX, tileY } = request;
    /**
        * has a list of targets that each take "FIRE_CALL_DAMAGE". The damage handler is the EXACT.SAME.AS.ATTACK.
        * split attack up in get_damage, ect.
        * 1. check if it is valid, the client-side check is just for visuals, do it here agaib
    */
    const isValid = FireMissionSystem.isValid(gameContext, callID, tileX, tileY);

    if(!isValid) {
        return null;
    }

    return null;
}

FireMissionAction.prototype.getTemplate = function(callID, tileX, tileY) {
    return {
        "callID": callID,
        "tileX": tileX,
        "tileY": tileY
    }
}