import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";
import { DropEvent } from "./drop.js";

export const EntityHitEvent = function() {}

EntityHitEvent.prototype = Object.create(ArmyEvent.prototype);
EntityHitEvent.prototype.constructor = EntityHitEvent;

EntityHitEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;
    const { entity, actor } = event;
    const hitRewards = DropSystem.getHitReward(entity);

    if(hitRewards) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actor, hitRewards));
    }
}

EntityHitEvent.createEvent = function(entity, actorID, damage, reason) {
    return {
        "entity": entity,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}