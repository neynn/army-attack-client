import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";

export const DebrisRemovedEvent = function() {}

DebrisRemovedEvent.prototype = Object.create(ArmyEvent.prototype);
DebrisRemovedEvent.prototype.constructor = DebrisRemovedEvent;

DebrisRemovedEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;

    const { actor } = event;
    const drops = DropSystem.getDebrisReward(gameContext, "Debris");

    if(drops) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, {
            "drops": drops,
            "receiverID": actor
        });
    }
}