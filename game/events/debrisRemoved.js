import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";

export const DebrisRemovedEvent = function() {}

DebrisRemovedEvent.prototype = Object.create(ArmyEvent.prototype);
DebrisRemovedEvent.prototype.constructor = DebrisRemovedEvent;

DebrisRemovedEvent.prototype.onStory = function(gameContext, event) {
    const { tileX, tileY, actorID } = event;

    DropSystem.createDebrisDrop(gameContext, "Debris", actorID, tileX, tileY);
}

DebrisRemovedEvent.createEvent = function(tileX, tileY, actorID) {
    return {
        "tileX": tileX,
        "tileY": tileY,
        "actorID": actorID
    }
}