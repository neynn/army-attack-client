import { getRandomChance } from "../../source/math/math.js";
import { GAME_EVENT } from "../enums.js";

export const DropSystem = function() {}

DropSystem.dropHitReward = function(gameContext, entity, receiverID) {
    const hitRewards = entity.config.hitRewards;

    if(!hitRewards || receiverID === null) {
        return;
    }

    const { world } = gameContext;
    const { eventBus } = world;
    const drops = [];
    
    for(let i = 0; i < hitRewards.length; i++) {
        const reward = hitRewards[i];
        const { type, id, value } = reward;

        drops.push({
            "type": type,
            "id": id,
            "value": value
        });
    }

    if(drops.length !== 0) {
        eventBus.emit(GAME_EVENT.REQUEST_DROP_HIT_ITEMS, { drops, receiverID });
    }
}

DropSystem.dropKillReward = function(gameContext, entity, receiverID) {
    const killRewards = entity.config.killRewards;

    if(!killRewards || receiverID === null) {
        return;
    }

    const { world } = gameContext;
    const { eventBus } = world;
    const drops = [];

    for(let i = 0; i < killRewards.length; i++) {
        const reward = killRewards[i];
        const { type, id, value, chance } = reward;

        if(chance === undefined) {
            drops.push({
                "type": type,
                "id": id,
                "value": value
            });
            
            continue;
        }

        const roll = getRandomChance();

        if(chance < roll) {
            continue;
        }

        drops.push({
            "type": type,
            "id": id,
            "value": value
        });
    }

    if(drops.length !== 0) {
        eventBus.emit(GAME_EVENT.REQUEST_DROP_KILL_ITEMS, { drops, receiverID });
    }
}