import { getRandomChance } from "../../source/math/math.js";
import { GameEvent } from "../gameEvent.js";

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
        eventBus.emit(GameEvent.TYPE.HIT_DROP, { drops, receiverID });
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
        eventBus.emit(GameEvent.TYPE.KILL_DROP, { drops, receiverID });
    }
}