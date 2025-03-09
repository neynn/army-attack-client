import { Inventory } from "./player/inventory.js";

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

export const dropItemsEvent = function(gameContext, items, controllerID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const receiver = turnManager.getController(controllerID);

    if(!receiver || !receiver.inventory) {
        return;
    }

    const inventory = receiver.inventory;

    for(let i = 0; i < items.length; i++) {
        const item = items[i];
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

export const choiceMadeEvent = function(gameContext, controllerID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const isActor = turnManager.isActor(controllerID);

    if(isActor) {
        turnManager.reduceActorActions(1);
    }
}

export const skipTurnEvent = function(gameContext, controllerID) {
    const { world } = gameContext;
    const { turnManager } = world;
    const isActor = turnManager.isActor(controllerID);

    if(isActor) {
        turnManager.cancelActorActions(0);
    }
}