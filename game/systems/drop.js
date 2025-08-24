import { getRandomChance } from "../../source/math/math.js";
import { ArmyEventHandler } from "../armyEventHandler.js";
import { DefaultTypes } from "../defaultTypes.js";
import { DropEvent } from "../events/drop.js";

export const DropSystem = function() {}

DropSystem.DROP_TYPE = {
    HIT: 0,
    KILL: 1,
    SELL: 2
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

DropSystem.createEntityDrop = function(gameContext, entity, dropType, actorID) {
    const { world } = gameContext;
    const { eventBus } = world;

    let rewards = null;

    switch(dropType) {
        case DropSystem.DROP_TYPE.HIT: {
            rewards = entity.config.hitRewards;
            break;
        }
        case DropSystem.DROP_TYPE.KILL: {
            rewards = entity.config.killRewards;
            break;
        }
        case DropSystem.DROP_TYPE.SELL: {
            if(entity.config.sell) {
                rewards = [entity.config.sell];
            }

            break;
        }
    }

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
    const debrisType = gameContext.debrisTypes[typeID];

    if(debrisType) {
        const { killRewards } = debrisType;

        if(killRewards) {
            const drops = getDropList(killRewards);

            if(drops.length !== 0) {
                eventBus.emit(ArmyEventHandler.TYPE.DROP, DropEvent.createEvent(actorID, drops, tileX, tileY));
            }
        }
    }
}