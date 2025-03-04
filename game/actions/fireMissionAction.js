import { Action } from "../../source/action/action.js";

export const FireMissionAction = function() {}

FireMissionAction.prototype = Object.create(Action.prototype);
FireMissionAction.prototype.constructor = FireMissionAction;