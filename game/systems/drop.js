import { getRandomChance } from "../../source/math/math.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { DefaultTypes } from "../defaultTypes.js";
import { DropEvent } from "../events/drop.js";

export const DropSystem = function() {}

DropSystem.DROP_TYPE = {
    HIT: 0,
    KILL: 1,
    SELL: 2,
    COLLECT: 3
};

const getDropList = function(rewards) {
    const drops = [];

    for(let i = 0; i < rewards.length; i++) {
        const { type, id, value, chance = 100 } = rewards[i];
        const randomRoll = getRandomChance();

        if(chance >= randomRoll) {
            const drop = DefaultTypes.createItemTransaction(type, id, value);

            drops.push(drop);
        }
    }

    return drops;
}

const getRewards = function(entity, dropType) {
    switch(dropType) {
        case DropSystem.DROP_TYPE.HIT: return entity.config.hitRewards;
        case DropSystem.DROP_TYPE.KILL: return entity.config.killRewards;
        case DropSystem.DROP_TYPE.SELL: return entity.config.sell ? [entity.config.sell] : null;
        case DropSystem.DROP_TYPE.COLLECT: return entity.getCollectRewards();
        default: return null;
    }
}

DropSystem.createEntityDrop = function(gameContext, entity, dropType, actorID) {
    const { world } = gameContext;
    const { eventBus } = world;
    const rewards = getRewards(entity, dropType);

    if(rewards) {
        const drops = getDropList(rewards);

        if(drops.length !== 0) {
            const { x, y } = entity.getCenterTile();

            eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops, x, y));
        }
    }
}

DropSystem.createDebrisDrop = function(gameContext, typeID, actorID, tileX, tileY) {
    const { world } = gameContext;
    const { eventBus } = world;
    const debrisType = gameContext.getDebrisType(typeID);

    if(debrisType) {
        const { clearRewards } = debrisType;
        const drops = getDropList(clearRewards);

        if(drops.length !== 0) {
            eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops, tileX, tileY));
        }
    }
}