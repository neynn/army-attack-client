import { Drop } from "./drop.js";
import { Inventory } from "../../actors/player/inventory/inventory.js";
import { getRandomNumber } from "../../../source/math/math.js";
import { DefaultTypes } from "../../defaultTypes.js";

export const DropHandler = function() {
    this.drops = [];
}

DropHandler.prototype.createDrop = function(gameContext, inventory, tileX, tileY, type, id, value) {
    const { spriteManager, transform2D } = gameContext;
    const sprite = spriteManager.createSprite("drop_money");
    const transaction = DefaultTypes.createItemTransaction(type, id, value);
    const drop = new Drop(transaction, inventory, sprite);
    const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);

    drop.setPosition(x + getRandomNumber(-48, 48), y);

    this.drops.push(drop);
}

DropHandler.prototype.createDrops = function(gameContext, drops, inventory) {
    for(let i = 0; i < drops.length; i++) {
        const { tileX, tileY, transaction } = drops[i];
        const { type, id, value } = transaction;
        const maxDrop = inventory.getMaxDrop(type, id);

        if(maxDrop === 0) {
            inventory.addByTransaction(transaction);
            continue;
        }

        let toDrop = value;

        while(toDrop >= maxDrop) {
            this.createDrop(gameContext, inventory, tileX, tileY, type, id, maxDrop);
            toDrop -= maxDrop;
        }

        if(toDrop !== 0) {
            this.createDrop(gameContext, inventory, tileX, tileY, type, id, toDrop);
        }
    }

    const energyDrops = inventory.updateEnergyCounter();

    //TODO: Add a way to add positions to these drops!
    for(let i = 0; i < energyDrops; i++) {
        this.createDrop(gameContext, inventory, 0, 0, Inventory.TYPE.RESOURCE, Inventory.ID.ENERGY, 1); 
    }
}

DropHandler.prototype.collectAllDrops = function() {
    for(let i = 0; i < this.drops.length; i++) {
        const drop = this.drops[i];

        drop.collect();
        drop.sprite.terminate();
    }

    this.drops = [];
}

DropHandler.prototype.update = function(gameContext, worldMap) {
    const { timer } = gameContext;
    const fixedDeltaTime = timer.getFixedDeltaTime();

    for(let i = this.drops.length - 1; i >= 0; i--) {
        const drop = this.drops[i];

        drop.update(gameContext, fixedDeltaTime);

        if(drop.state === Drop.STATE.COLLECTED) {
            drop.sprite.terminate();

            this.drops[i] = this.drops[this.drops.length - 1];
            this.drops.pop();
        }
    }
}