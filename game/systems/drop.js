import { getRandomChance } from "../../source/math/math.js";
import { Inventory } from "../actors/player/inventory.js";

export const DropSystem = function() {}

const getMaxDrop = function(gameContext, type, id) {
    switch(type) {
        case Inventory.TYPE.ITEM: {
            const item = gameContext.itemTypes[id];

            if(!item || !item.maxDrop) {
                return 0;
            }

            return item.maxDrop;
        }
        case Inventory.TYPE.RESOURCE: {
            const resource = gameContext.resourceTypes[id];

            if(!resource || !resource.maxDrop) {
                return 0;
            }

            return resource.maxDrop;
        }
        default: {
            return 0;
        }
    }
}

DropSystem.dropItems = function(gameContext, drops, inventory) {
    for(let i = 0; i < drops.length; i++) {
        const item = drops[i];
        const { type, id, value } = item;
        const maxDrop = getMaxDrop(gameContext, type, id);

        if(maxDrop === 0) {
            inventory.add(type, id, value);
            continue;
        }

        let toDrop = value;

        while(toDrop >= maxDrop) {
            toDrop -= maxDrop;

            inventory.add(type, id, maxDrop);
        }

        if(toDrop !== 0) {
            inventory.add(type, id, toDrop);
        }
    }

    let energyDrops = 0;
    let energyCounter = inventory.resources.get("EnergyCounter");

    while(energyCounter >= 100) {
        energyCounter -= 100;
        energyDrops++;
    }

    if(energyDrops > 0) {
        inventory.resources.set("EnergyCounter", energyCounter);
        inventory.add(Inventory.TYPE.RESOURCE, "Energy", energyDrops);
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
        const { type, id, value } = reward;

        drops.push({
            "type": type,
            "id": id,
            "value": value
        });
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

    if(drops.length === 0) {
        return null;
    }

    return drops;
}