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

DropHandler.prototype.createDrop = function(gameContext, type, id, value, inventory) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createCustomSprite("red_infantry_fire");

    const drop = new Drop({
        "type": type,
        "id": id,
        "value": value
    }, inventory, sprite);

    this.drops.push(drop);
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
            this.createDrop(gameContext, type, id, maxDrop, inventory);
            toDrop -= maxDrop;
        }

        if(toDrop !== 0) {
            this.createDrop(gameContext, type, id, toDrop, inventory);
        }
    }

    const energyCounter = inventory.resources.get(Inventory.ID.ENERGY_COUNTER);

    while(energyCounter.has(Inventory.COUNTER_TO_ENERGY_RATIO)) {
        this.createDrop(gameContext, Inventory.TYPE.RESOURCE, Inventory.ID.ENERGY, 1, inventory);
        energyCounter.remove(Inventory.COUNTER_TO_ENERGY_RATIO);
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