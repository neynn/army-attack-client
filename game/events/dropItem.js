import { Inventory } from "../player/inventory.js";

const getMaxDrop = function(gameContext, type, id) {
    const itemTypes = gameContext.getConfig("ItemType");
    const resourceTypes = gameContext.getConfig("ResourceType");

    switch(type) {
        case Inventory.TYPE.ITEM: {
            const item = itemTypes[id];

            if(!item) {
                return 0;
            }

            return item.maxDrop;
        }
        case Inventory.TYPE.RESOURCE: {
            const resource = resourceTypes[id];

            if(!resource) {
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
    const { controllerManager } = world;
    const receiver = controllerManager.getController(controllerID);

    if(!receiver || !receiver.inventory) {
        return;
    }

    for(let i = 0; i < items.length; i++) {
        const item = items[i];
        const { type, id, value } = item;
        const maxDrop = getMaxDrop(gameContext, type, id);

        if(maxDrop === 0) {
            receiver.inventory.add(type, id, value);
            continue;
        }

        let toDrop = value;

        while(toDrop >= maxDrop) {
            toDrop -= maxDrop;

            receiver.inventory.add(type, id, maxDrop);
        }

        if(toDrop !== 0) {
            receiver.inventory.add(type, id, toDrop);
        }
    }

    //TODO: Check inventory for overflow of "BackgroundEnergy" and drop it.
}