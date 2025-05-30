import { Item } from "./item.js";

export const Inventory = function() {
    this.items = new Map();
    this.resources = new Map();
}

Inventory.RESOURCE_MAX_COUNT = 999999999;
Inventory.COUNTER_TO_ENERGY_RATIO = 100;

Inventory.ID = {
    ENERGY: "Energy",
    ENERGY_COUNTER: "EnergyCounter"
};

Inventory.TYPE = {
    RESOURCE: "Resource",
    ITEM: "Item"
};

Inventory.prototype.save = function() {
    const items = {};
    const resources = {};

    this.items.forEach((item, id) => {
        if(item.count > 0) {
            items[id] = item.count;
        }
    });

    this.resources.forEach((resource, id) => {
        if(resource.count > 0) {
            resources[id] = resource.count;
        }
    });

    return {
        "items": items,
        "resources": resources
    }
}

Inventory.prototype.load = function(blob) {
    const { items, resources } = blob;

    for(const itemID in items) {
        const count = items[itemID];
        const item = this.items.get(itemID);

        if(item) {
            item.setCount(count);
        }
    }

    for(const resourceID in resources) {
        const count = resources[resourceID];
        const item = this.resources.get(resourceID);

        if(item) {
            item.setCount(count);
        }
    }
}

Inventory.prototype.getItem = function(type, id) {
    let item = null;

    switch(type) {
        case Inventory.TYPE.ITEM: {
            item = this.items.get(id);
            break;
        }
        case Inventory.TYPE.RESOURCE: {
            item = this.resources.get(id);
            break;
        }
        default: {
            console.warn(`ItemType ${type} is unknown!`);
            break;
        }
    }

    if(!item) {
        return null;
    }

    return item;
}

Inventory.prototype.init = function(gameContext) {
    const { itemTypes, resourceTypes } = gameContext;

    for(const itemID in itemTypes) {
        const { maxStack, maxDrop } = itemTypes[itemID];
        const item = new Item(maxDrop, maxStack);

        item.setCount(0);

        this.items.set(itemID, item);
    }

    for(const resourceID in resourceTypes) {
        const { maxDrop } = resourceTypes[resourceID];
        const item = new Item(maxDrop, Inventory.RESOURCE_MAX_COUNT);

        item.setCount(1000);

        this.resources.set(resourceID, item);
    }
}

Inventory.prototype.getMaxDrop = function(type, id) {
    const itemType = this.getItem(type, id);

    if(!itemType) {
        return 0;
    }

    return itemType.maxDrop;
}

Inventory.prototype.has = function(type, id, value) {
    const itemType = this.getItem(type, id);

    if(!itemType) {
        return false;
    }

    return itemType.has(value);
}

Inventory.prototype.remove = function(type, id, value) {
    const itemType = this.getItem(type, id);

    if(itemType) {
        itemType.remove(value);
    }
}

Inventory.prototype.add = function(type, id, value) {
    const itemType = this.getItem(type, id);

    if(itemType) {
        itemType.add(value);
        console.log("ADD", type, id, value);
    }
}