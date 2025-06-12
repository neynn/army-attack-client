import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { ArmyEvent } from "./armyEvent.js";

export const EntityKillEvent = function() {}

EntityKillEvent.prototype = Object.create(ArmyEvent.prototype);
EntityKillEvent.prototype.constructor = EntityKillEvent;

EntityKillEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus, turnManager } = world;

    const { entity, reason, actor } = event;
    const killRewards = DropSystem.getKillReward(entity);

    if(killRewards) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, {
            "drops": killRewards,
            "receiverID": actor
        });
    }

    const player = turnManager.getActor(actor);

    if(player && player.missions) {
        const entityType = entity.config.id;

        player.missions.onObjective(ArmyEventHandler.OBJECTIVE_TYPE.DESTROY, entityType, 1);
    }
    
    eventBus.emit(ArmyEventHandler.TYPE.ENTITY_DEATH, {
        "entity": entity,
        "reason": reason
    });
}