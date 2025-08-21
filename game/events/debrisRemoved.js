import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";
import { DropEvent } from "./drop.js";

export const DebrisRemovedEvent = function() {}

DebrisRemovedEvent.prototype = Object.create(ArmyEvent.prototype);
DebrisRemovedEvent.prototype.constructor = DebrisRemovedEvent;

DebrisRemovedEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;

    const { tileX, tileY, actorID } = event;
    const drops = DropSystem.getDebrisReward(gameContext, "Debris", tileX, tileY);

    if(drops.length !== 0) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops));
    }
}

DebrisRemovedEvent.createEvent = function(tileX, tileY, actorID) {
    return {
        "tileX": tileX,
        "tileY": tileY,
        "actorID": actorID
    }
}