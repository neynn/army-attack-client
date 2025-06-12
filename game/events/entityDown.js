import { ArmyEvent } from "./armyEvent.js";

export const EntityDownEvent = function() {}

EntityDownEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDownEvent.prototype.constructor = EntityDownEvent;