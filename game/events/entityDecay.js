import { ArmyEventHandler } from "../armyEventHandler.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntityDecayEvent = function() {}

EntityDecayEvent.prototype = Object.create(ArmyEvent.prototype);
EntityDecayEvent.prototype.constructor = EntityDecayEvent;

EntityDecayEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity } = event;

    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DEATH, {
        "entity": entity,
        "reason": ArmyEventHandler.KILL_REASON.DECAY
    });
}