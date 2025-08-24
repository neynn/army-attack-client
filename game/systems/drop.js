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
 * @param {ArmyEntity} entity 
 * @returns {DropType[]}
 */
DropSystem.getHitReward = function(entity) {
    const hitRewards = entity.config.hitRewards;

    if(!hitRewards) {
        return null;
    }
    
    const drops = [];

    for(let i = 0; i < hitRewards.length; i++) {
        const drop = getDrop(hitRewards[i]);

        if(drop) {
            drops.push(drop);
        }
    }

    if(drops.length === 0) {
        return null;
    }

    const { x, y } = entity.getCenterTile();

    return DefaultTypes.createDropContainer(drops, x, y);
}

/**
 * Gets a list of rewards from killing an enemy.
 * 
 * @param {ArmyEntity} entity 
 * @returns {DropType[]}
 */
DropSystem.getKillReward = function(entity) {
    const killRewards = entity.config.killRewards;

    if(!killRewards) {
        return null;
    }

    const drops = [];

    for(let i = 0; i < killRewards.length; i++) {
        const drop = getDrop(killRewards[i]);

        if(drop) {
            drops.push(drop);
        }
    }

    if(drops.length === 0) {
        return null;
    }

    const { x, y } = entity.getCenterTile();

    return DefaultTypes.createDropContainer(drops, x, y);
}

/**
 * Gets a list of rewards from cleaning debris.
 * 
 * @param {*} gameContext 
 * @param {*} typeID 
 * @param {*} tileX 
 * @param {*} tileY 
 * @returns {DropContainer}
 */
DropSystem.getDebrisReward = function(gameContext, typeID, tileX, tileY) {
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
        const drop = getDrop(killRewards[i]);

        if(drop) {
            drops.push(drop);
        }
    }

    if(drops.length === 0) {
        return null;
    }

    return DefaultTypes.createDropContainer(drops, tileX, tileY);
}

/**
 * Gets a list of rewards from selling an entity.
 * 
 * @param {ArmyEntity} entity 
 * @returns {DropContainer}
 */
DropSystem.getSellReward = function(entity) {
    const sellReward = entity.config.sell;

    if(!sellReward) {
        return null;
    }

    const drop = getDrop(sellReward);

    if(!drop) {
        return null;
    }

    const { x, y } = entity.getCenterTile();

    return DefaultTypes.createDropContainer([drop], x, y);
}