import { Drop } from "./drop.js";
import { Inventory } from "../../actors/player/inventory/inventory.js";

export const DropHandler = function() {
    this.drops = [];
}

DropHandler.prototype.getMaxDrop = function(gameContext, type, id) {
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

DropHandler.prototype.createDrops = function(gameContext, drops, inventory) {
    for(let i = 0; i < drops.length; i++) {
        const { type, id, value } = drops[i];
        const maxDrop = this.getMaxDrop(gameContext, type, id);

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

DropHandler.prototype.update = function(gameContext, worldMap) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    for(let i = this.drops.length - 1; i >= 0; i--) {
        const drop = this.drops[i];

        drop.update(gameContext, fixedDeltaTime);

        if(drop.state === Drop.STATE.COLLECTED) {
            this.drops.splice(i, 1);
        }
    }
}