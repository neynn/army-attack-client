import { getRandomChance } from "../../source/math/math.js";

export const DropSystem = function() {}

DropSystem.getHitReward = function(entity) {
    const hitRewards = entity.config.hitRewards;

    if(!hitRewards) {
        return;
    }

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

    return drops;
}

DropSystem.getKillReward = function(entity) {
    const killRewards = entity.config.killRewards;

    if(!killRewards) {
        return;
    }

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

    return drops;
}