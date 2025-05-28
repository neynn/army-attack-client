import { getRandomChance } from "../../source/math/math.js";

/**
 * Collection of functions revolving around the dropping of items.
 */
export const DropSystem = function() {}

/**
 * Returns a drop item based on chance.
 * If no chance is specified, the item always gets returned.
 * 
 * @param {{type:string, id:string, value:int, chance: int}} reward 
 * @returns 
 */
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

/**
 * Gets a list of rewards from hitting an enemy.
 * 
 * @param {*} entity 
 * @returns {{id: string, type: string, value: int}[]}
 */
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

/**
 * Gets a list of rewards from killing an enemy.
 * 
 * @param {*} entity 
 * @returns {{id: string, type: string, value: int}[]}
 */
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

/**
 * Gets a list of rewards from cleaning debris.
 * 
 * @param {*} entity 
 * @returns {{id: string, type: string, value: int}[]}
 */
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

/**
 * Gets a list of rewards from selling an entity.
 * 
 * @param {*} entity 
 * @returns {{id: string, type: string, value: int}[]}
 */
DropSystem.getSellReward = function(entity) {
    const sellReward = entity.config.sell;

    if(!sellReward) {
        return null;
    }

    const drops = [];
    const drop = getDrop(sellReward);

    if(drop) {
        drops.push(drop);
    }

    if(drops.length === 0) {
        return null;
    }

    return drops;
}