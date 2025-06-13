import { ArmyEvent } from "./armyEvent.js";

export const EntityDownEvent = function() {}

EntityDownEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDownEvent.prototype.constructor = EntityDownEvent;

EntityDownEvent.createEvent = function(entity, actorID, damage, reason) {
    return {
        "entity": entity,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}