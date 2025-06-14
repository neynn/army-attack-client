import { getRandomChance } from "../../source/math/math.js";
import { DefaultTypes } from "../defaultTypes.js";

/**
 * Collection of functions revolving around the dropping of items.
 */
export const DropSystem = function() {}

/**
 * Returns a drop item based on chance.
 * If no chance is specified, the item always gets returned.
 * 
 * @param {RewardType} reward 
 * @returns {ItemTransaction | null}
 */
const getDrop = function(reward) {
    const { type, id, value, chance = 100 } = reward;
    const randomRoll = getRandomChance();

    if(chance < randomRoll) {
        return null;
    }

    return DefaultTypes.createItemTransaction(type, id, value);
}

/**
 * Gets a list of rewards from hitting an enemy.
 * 
 * @param {*} entity 
 * @returns {DropType[]}
 */
DropSystem.getHitReward = function(entity) {
    const hitRewards = entity.config.hitRewards;
    const drops = [];

    if(!hitRewards) {
        return drops;
    }
    
    for(let i = 0; i < hitRewards.length; i++) {
        const drop = getDrop(hitRewards[i]);

        if(drop) {
            drops.push(drop);
        }
    }

    return drops;
}

/**
 * Gets a list of rewards from killing an enemy.
 * 
 * @param {*} entity 
 * @returns {DropType[]}
 */
DropSystem.getKillReward = function(entity) {
    const killRewards = entity.config.killRewards;
    const drops = [];

    if(!killRewards) {
        return drops;
    }

    for(let i = 0; i < killRewards.length; i++) {
        const drop = getDrop(killRewards[i]);

        if(drop) {
            drops.push(drop);
        }
    }

    return drops;
}

/**
 * Gets a list of rewards from cleaning debris.
 * 
 * @param {*} entity 
 * @returns {DropType[]}
 */
DropSystem.getDebrisReward = function(gameContext, typeID) {
    const debrisType = gameContext.debrisTypes[typeID];
    const drops = [];

    if(!debrisType) {
        return drops;
    }

    const { killRewards } = debrisType;

    if(!killRewards) {
        return drops;
    }

    for(let i = 0; i < killRewards.length; i++) {
        const drop = getDrop(killRewards[i]);

        if(drop) {
            drops.push(drop);
        }
    }

    return drops;
}

/**
 * Gets a list of rewards from selling an entity.
 * 
 * @param {*} entity 
 * @returns {DropType[]}
 */
DropSystem.getSellReward = function(entity) {
    const sellReward = entity.config.sell;
    const drops = [];

    if(!sellReward) {
        return drops;
    }

    const drop = getDrop(sellReward);

    if(drop) {
        drops.push(drop);
    }

    return drops;
}