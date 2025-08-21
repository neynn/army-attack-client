import { getRandomChance } from "../../source/math/math.js";
import { DefaultTypes } from "../defaultTypes.js";
import { ArmyEntity } from "../init/armyEntity.js";

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
const getDrop = function(reward, tileX = 0, tileY = 0) {
    const { type, id, value, chance = 100 } = reward;
    const randomRoll = getRandomChance();

    if(chance < randomRoll) {
        return null;
    }

    return {
        "transaction": DefaultTypes.createItemTransaction(type, id, value),
        "tileX": tileX,
        "tileY": tileY
    }
}

/**
 * Gets a list of rewards from hitting an enemy.
 * 
 * @param {ArmyEntity} entity 
 * @returns {DropType[]}
 */
DropSystem.getHitReward = function(entity) {
    const hitRewards = entity.config.hitRewards;
    const drops = [];

    if(!hitRewards) {
        return drops;
    }
    
    const { x, y } = entity.getCenterTile();

    for(let i = 0; i < hitRewards.length; i++) {
        const drop = getDrop(hitRewards[i], x, y);

        if(drop) {
            drops.push(drop);
        }
    }

    return drops;
}

/**
 * Gets a list of rewards from killing an enemy.
 * 
 * @param {ArmyEntity} entity 
 * @returns {DropType[]}
 */
DropSystem.getKillReward = function(entity) {
    const killRewards = entity.config.killRewards;
    const drops = [];

    if(!killRewards) {
        return drops;
    }

    const { x, y } = entity.getCenterTile();

    for(let i = 0; i < killRewards.length; i++) {
        const drop = getDrop(killRewards[i], x, y);

        if(drop) {
            drops.push(drop);
        }
    }

    return drops;
}

/**
 * Gets a list of rewards from cleaning debris.
 * 
 * @param {*} gameContext 
 * @param {*} typeID 
 * @param {*} tileX 
 * @param {*} tileY 
 * @returns {DropType[]}
 */
DropSystem.getDebrisReward = function(gameContext, typeID, tileX, tileY) {
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
        const drop = getDrop(killRewards[i], tileX, tileY);

        if(drop) {
            drops.push(drop);
        }
    }

    return drops;
}

/**
 * Gets a list of rewards from selling an entity.
 * 
 * @param {ArmyEntity} entity 
 * @returns {DropType[]}
 */
DropSystem.getSellReward = function(entity) {
    const sellReward = entity.config.sell;
    const drops = [];

    if(!sellReward) {
        return drops;
    }

    const { x, y } = entity.getCenterTile();
    const drop = getDrop(sellReward, x, y);

    if(drop) {
        drops.push(drop);
    }

    return drops;
}