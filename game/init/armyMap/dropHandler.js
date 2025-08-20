import { Drop } from "./drop.js";
import { Inventory } from "../../actors/player/inventory/inventory.js";
import { getRandomNumber } from "../../../source/math/math.js";
import { DefaultTypes } from "../../defaultTypes.js";

export const DropHandler = function() {
    this.drops = [];
}

DropHandler.prototype.createDrop = function(gameContext, type, id, value, inventory) {
    const { spriteManager } = gameContext;
    const sprite = spriteManager.createSprite("drop_money");
    const transaction = DefaultTypes.createItemTransaction(type, id, value);
    const drop = new Drop(transaction, inventory, sprite);

    drop.setPosition(100 + getRandomNumber(-50, 50), 100);

    this.drops.push(drop);
}

DropHandler.prototype.createDrops = function(gameContext, drops, inventory) {
    for(let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const { type, id, value } = drop;
        const maxDrop = inventory.getMaxDrop(type, id);

        if(maxDrop === 0) {
            inventory.handleTransaction(drop);
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

    const energyDrops = inventory.updateEnergyCounter();

    for(let i = 0; i < energyDrops; i++) {
        this.createDrop(gameContext, Inventory.TYPE.RESOURCE, Inventory.ID.ENERGY, 1, inventory); 
    }
}

DropHandler.prototype.update = function(gameContext, worldMap) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    for(let i = this.drops.length - 1; i >= 0; i--) {
        const drop = this.drops[i];

        drop.update(gameContext, fixedDeltaTime);

        if(drop.state === Drop.STATE.COLLECTED) {
            drop.sprite.terminate();
            this.drops.splice(i, 1);
        }
    }
}