import { clampValue } from "../../source/math/math.js";

export const Inventory = function() {
    this.items = new Map();
    this.maxItemStacks = new Map();
    this.resources = new Map();
}

Inventory.TYPE = {
    RESOURCE: "Resource",
    ITEM: "Item"
};

Inventory.prototype.save = function() {
    const items = [];
    const resources = [];

    for(const [itemID, count] of this.items) {
        if(count > 0) {
            items.push({
                "id": itemID,
                "value": count
            });
        }
    }

    for(const [resourceID, count] of this.resources) {
        if(count > 0) {
            resources.push({
                "id": resourceID,
                "value": count
            });
        }
    }

    return {
        "items": items,
        "resources": resources
    }
}

Inventory.prototype.load = function(blob) {
    const { items, resources } = blob;

    for(let i = 0; i < items.length; i++) {
        const { id, value } = items[i];

        if(this.items.has(id)) {
            this.items.set(id, value);
        }
    }

    for(let i = 0; i < resources.length; i++) {
        const { id, value } = resources[i];

        if(this.resources.has(id)) {
            this.resources.set(id, value);
        }
    }
}

Inventory.prototype.init = function(gameContext) {
    const itemTypes = gameContext.getConfig("ItemType");
    const resourceTypes = gameContext.getConfig("ResourceType");

    for(const itemID in itemTypes) {
        const itemType = itemTypes[itemID];
        const { maxStack = 0 } = itemType;

        this.items.set(itemID, 0);
        this.maxItemStacks.set(itemID, maxStack);
    }

    for(const resourceID in resourceTypes) {
        this.resources.set(resourceID, 0);
    }
} 

Inventory.prototype.remove = function(type, id, value) {
    switch(type) {
        case Inventory.TYPE.ITEM: {
            if(this.items.has(id)) {
                const count = this.items.get(id);
                const nextValue = clampValue(count - value, count, 0);

                this.items.set(id, nextValue);
            }
            break;
        }
        case Inventory.TYPE.RESOURCE: {
            if(this.resources.has(id)) {
                const count = this.resources.get(id);
                const nextValue = clampValue(count - value, count, 0);

                this.resources.set(id, nextValue);
            }
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
            if(this.items.has(id)) {
                const count = this.items.get(id);
                const maxStack = this.maxItemStacks.get(id);
                const nextValue = clampValue(count + value, maxStack, count);

                this.items.set(id, nextValue);
            }
            break;
        }
        case Inventory.TYPE.RESOURCE: {
            if(this.resources.has(id)) {
                const count = this.resources.get(id);
                const nextValue = clampValue(count + value, Number.MAX_SAFE_INTEGER, count);

                this.resources.set(id, nextValue);
            }
            break;
        }
        default: {
            console.warn(`RewardType ${type} is unknown!`);
            break;
        }
    }
}