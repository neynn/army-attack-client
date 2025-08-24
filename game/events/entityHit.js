import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";
import { DropEvent } from "./drop.js";

export const EntityHitEvent = function() {}

EntityHitEvent.prototype = Object.create(ArmyEvent.prototype);
EntityHitEvent.prototype.constructor = EntityHitEvent;

EntityHitEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus, entityManager } = world;
    const { entityID, actor } = event;
    const entity = entityManager.getEntity(entityID);

    if(entity) {
        const hitReward = DropSystem.getHitReward(entity);

        if(hitReward) {
            eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actor, hitReward));
        }
    }
}

EntityHitEvent.createEvent = function(entityID, actorID, damage, reason) {
    return {
        "entityID": entityID,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}