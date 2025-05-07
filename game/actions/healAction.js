import { Action } from "../../source/action/action.js";

export const HealAction = function() {}

HealAction.prototype = Object.create(Action.prototype);
HealAction.prototype.constructor = HealAction;

HealAction.prototype.getTemplate = function(entityID, actorID) {
    return {
        "entityID": entityID,
        "actorID": actorID
    }
}