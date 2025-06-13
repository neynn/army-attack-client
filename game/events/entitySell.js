import { ArmyEventHandler } from "../armyEventHandler.js";
import { DropSystem } from "../systems/drop.js";
import { SpawnSystem } from "../systems/spawn.js";
import { ArmyEvent } from "./armyEvent.js";
import { DropEvent } from "./drop.js";

export const EntitySellEvent = function() {}

EntitySellEvent.prototype = Object.create(ArmyEvent.prototype);
EntitySellEvent.prototype.constructor = EntitySellEvent;

EntitySellEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { eventBus } = world;

    const { actorID, entity } = event;
    const sellRewards = DropSystem.getSellReward(entity);

    if(sellRewards) {
        eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, sellRewards));
    }

    SpawnSystem.destroyEntity(gameContext, entity);
}