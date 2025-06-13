import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";
import { DropEvent } from "./drop.js";

export const EntityKillEvent = function() {}

EntityKillEvent.prototype = Object.create(ArmyEvent.prototype);
EntityKillEvent.prototype.constructor = EntityKillEvent;

EntityKillEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus, turnManager } = world;

    const { entity, reason, actorID } = event;
    const killRewards = DropSystem.getKillReward(entity);

    if(killRewards) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, killRewards));
    }

    const player = turnManager.getActor(actorID);

    if(player && player.missions) {
        const entityType = entity.config.id;

        player.missions.onObjective(ArmyEventHandler.OBJECTIVE_TYPE.DESTROY, entityType, 1);
    }
    
    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DEATH, {
        "entity": entity,
        "reason": reason
    });
}

EntityKillEvent.createEvent = function(entity, actorID, damage, reason) {
    return {
        "entity": entity,
        "actorID": actorID,
        "damage": damage,
        "reason": reason
    }
}