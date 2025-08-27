import { Drop } from "./drop.js";
import { Inventory } from "../../actors/player/inventory/inventory.js";
import { getRandomNumber } from "../../../source/math/math.js";
import { DefaultTypes } from "../../defaultTypes.js";

export const DropHandler = function() {
    this.drops = [];
    this.deltaTime = 0;
}

DropHandler.TIME_BETWEEN_SOUNDS_S = 0.5;

DropHandler.prototype.createDrop = function(gameContext, inventory, tileX, tileY, type, id, value) {
    const { spriteManager, transform2D } = gameContext;
    const sprite = spriteManager.createSprite("drop_money");
    const transaction = DefaultTypes.createItemTransaction(type, id, value);

    if(sprite) {
        const { x, y } = transform2D.transformTileToWorldCenter(tileX, tileY);
        const drop = new Drop(transaction, inventory, sprite);

        drop.setPosition(x + getRandomNumber(-48, 48), y);

        this.drops.push(drop);
    } else {
        inventory.addByTransaction(transaction);
    }
}

DropHandler.prototype.createDrops = function(gameContext, inventory, drops, tileX, tileY) {
    for(let i = 0; i < drops.length; i++) {
        const { type, id, value } = drops[i];
        const maxDrop = inventory.getMaxDrop(type, id);

        if(maxDrop !== 0) {
            let toDrop = value;

            while(toDrop >= maxDrop) {
                this.createDrop(gameContext, inventory, tileX, tileY, type, id, maxDrop);
                toDrop -= maxDrop;
            }

            if(toDrop !== 0) {
                this.createDrop(gameContext, inventory, tileX, tileY, type, id, toDrop);
            }
        } else {
            inventory.addByTransaction(drops[i]);
        }
    }

    const energyDrops = inventory.updateEnergyCounter();

    for(let i = 0; i < energyDrops; i++) {
        this.createDrop(gameContext, inventory, tileX, tileY, Inventory.TYPE.RESOURCE, Inventory.RESOURCE_TYPE.ENERGY, 1); 
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

DropHandler.prototype.playCursorCollectSound = function(gameContext) {
    const { client } = gameContext;
    const { soundPlayer } = client;

    if(this.deltaTime >= DropHandler.TIME_BETWEEN_SOUNDS_S) {
        soundPlayer.play("sound_collect_1st_item");

        this.deltaTime = 0;
    }
}

DropHandler.prototype.update = function(gameContext) {
    const { timer } = gameContext;
    const { x, y, r } = gameContext.getMousePosition();
    const fixedDeltaTime = timer.getFixedDeltaTime();
    const toRemove = [];

    this.deltaTime += fixedDeltaTime;

    for(let i = 0; i < this.drops.length; i++) {
        const drop = this.drops[i];

        drop.update(x, y, r, fixedDeltaTime);

        switch(drop.state) {
            case Drop.STATE.COLLECTING_CURSOR: {
                this.playCursorCollectSound(gameContext);
                break;
            }
            case Drop.STATE.COLLECTED: {
                toRemove.push(i);
                break;
            }
        }
    }

    for(let i = toRemove.length - 1; i >= 0; i--) {
        const index = toRemove[i];

        this.drops[index].sprite.terminate();
        this.drops[index] = this.drops[this.drops.length - 1];
        this.drops.pop();
    }
}