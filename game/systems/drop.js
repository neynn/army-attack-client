import { getRandomChance } from "../../source/math/math.js";

export const DropSystem = function() {}

const getDrop = function(reward) {
    const { type, id, value, chance } = reward;

    if(chance === undefined) {
        return {
            "type": type,
            "id": id,
            "value": value
        }
    }

    const roll = getRandomChance();

    if(chance < roll) {
        return null;
    }

    return {
        "type": type,
        "id": id,
        "value": value
    }
}

DropSystem.getHitReward = function(entity) {
    const hitRewards = entity.config.hitRewards;

    if(!hitRewards) {
        return null;
    }

    const drops = [];
    
    for(let i = 0; i < hitRewards.length; i++) {
        const reward = hitRewards[i];
        const drop = getDrop(reward);

        if(drop) {
            drops.push(drop);
        }
    }

    if(drops.length === 0) {
        return null;
    }

    return drops;
}

DropSystem.getKillReward = function(entity) {
    const killRewards = entity.config.killRewards;

    if(!killRewards) {
        return null;
    }

    const drops = [];

    for(let i = 0; i < killRewards.length; i++) {
        const reward = killRewards[i];
        const drop = getDrop(reward);

        if(drop) {
            drops.push(drop);
        }
    }

    if(drops.length === 0) {
        return null;
    }

    return drops;
}

DropSystem.getDebrisReward = function(gameContext, typeID) {
    const debrisType = gameContext.debrisTypes[typeID];

    if(!debrisType) {
        return null;
    }

    const { killRewards } = debrisType;

    if(!killRewards) {
        return null;
    }

    const drops = [];

    for(let i = 0; i < killRewards.length; i++) {
        const reward = killRewards[i];
        const drop = getDrop(reward);

        if(drop) {
            drops.push(drop);
        }
    }

    if(drops.length === 0) {
        return null;
    }

    return drops;
}