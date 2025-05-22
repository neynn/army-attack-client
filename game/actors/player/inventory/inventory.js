import { Item } from "./item.js";

export const Inventory = function() {
    this.items = new Map();
    this.resources = new Map();
}

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

Inventory.prototype.has = function(type, id, value) {
    let hasItems = false;
    
    switch(type) {
        case Inventory.TYPE.ITEM: {
            const item = this.items.get(id);

            if(item) {
                hasItems = item.has(value);
            }

            break;
        }
        case Inventory.TYPE.RESOURCE: {
            const item = this.resources.get(id);

            if(item) {
                hasItems = item.has(value);
            }

            break;
        }
        default: {
            console.warn(`RewardType ${type} is unknown!`);
            break;
        }
    }

    return hasItems;
}

Inventory.prototype.init = function(gameContext) {
    const { itemTypes, resourceTypes } = gameContext;

    for(const itemID in itemTypes) {
        const { maxStack = 0, maxDrop = 1 } = itemTypes[itemID];
        const item = new Item();

        item.setMaxDrop(maxDrop);
        item.setMaxCount(maxStack);
        item.setCount(0);

        this.items.set(itemID, item);
    }

    for(const resourceID in resourceTypes) {
        const { maxDrop = 1 } = resourceTypes[resourceID];
        const item = new Item();

        item.setMaxDrop(maxDrop);
        item.setMaxCount(999999);
        item.setCount(1000);

        this.resources.set(resourceID, item);
    }
}

Inventory.prototype.remove = function(type, id, value) {
    switch(type) {
        case Inventory.TYPE.ITEM: {
            const item = this.items.get(id);

            if(item) {
                item.remove(value);
            }

            break;
        }
        case Inventory.TYPE.RESOURCE: {
            const item = this.resources.get(id);

            if(item) {
                item.remove(value);
            }

            console.log("Taken", value, id);
            break;
        }
        default: {
            console.warn(`RewardType ${type} is unknown!`);
            break;
        }
    }
}

Inventory.prototype.add = function(type, id, value) {
    switch(type) {
        case Inventory.TYPE.ITEM: {
            const item = this.items.get(id);

            if(item) {
                item.add(value);
            }

            break;
        }
        case Inventory.TYPE.RESOURCE: {
            const item = this.resources.get(id);

            if(item) {
                item.add(value);
            }

            break;
        }
        default: {
            console.warn(`RewardType ${type} is unknown!`);
            break;
        }
    }

    console.log("ADD", type, id, value)
}