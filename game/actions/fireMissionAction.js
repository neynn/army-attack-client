import { Action } from "../../source/action/action.js";

export const FireMissionAction = function() {}

FireMissionAction.prototype = Object.create(Action.prototype);
FireMissionAction.prototype.constructor = FireMissionAction;

FireMissionAction.prototype.getValidated = function(gameContext, request, messengerID) {
    /**
        * has a list of targets that each take "FIRE_CALL_DAMAGE". The damage handler is the EXACT.SAME.AS.ATTACK.
    */

    return null;
}

FireMissionAction.prototype.getTemplate = function(callID, tileX, tileY) {
    return {
        "callID": callID,
        "tileX": tileX,
        "tileY": tileY
    }
}