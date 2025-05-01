import { Inventory } from "./actors/player/inventory.js";
import { GAME_EVENT } from "./enums.js";
import { DropSystem } from "./systems/drop.js";

export const GameEvent = function() {
    this.id = 0;
}

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

GameEvent.dropItems = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, eventBus } = world;
    const { drops, receiverID } = event;
    const receiver = turnManager.getActor(receiverID);

    if(!receiver || !receiver.inventory) {
        return;
    }

    const inventory = receiver.inventory;

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

    eventBus.emit(GAME_EVENT.ITEMS_DROPPED, { receiverID, drops });
}

GameEvent.choiceMade = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;
    const isActor = turnManager.isActor(actorID);

    if(isActor) {
        turnManager.reduceActorActions(1);
    }
}

GameEvent.skipTurn = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager } = world;
    const { actorID } = event;
    const isActor = turnManager.isActor(actorID);

    if(isActor) {
        turnManager.cancelActorActions();
    }
}

GameEvent.entityHit = function(gameContext, event) {
    const { target } = event;
    console.log("HIT", event);
    DropSystem.dropHitReward(gameContext, target, "Player");
}

GameEvent.entityKilled = function(gameContext, event) {
    const { target } = event;
    console.log("KILLED", event);
    DropSystem.dropKillReward(gameContext, target, "Player");
}

GameEvent.entityDown = function(gameContext, event) {
    console.log("DOWN", event);
}

GameEvent.tileCaptured = function(gameContext, event) {
    console.log("CAPTURED", event);
}

GameEvent.itemsDropped = function(gameContext, event) {
    console.log("DROP", event);
}