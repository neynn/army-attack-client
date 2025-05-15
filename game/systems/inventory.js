import { Inventory } from "../actors/player/inventory/inventory.js";

export const InventorySystem = function() {}

InventorySystem.takeResource = function(actor, id, value) {
    const { inventory } = actor;

    if(!inventory) {
        return false;
    }

    inventory.remove(Inventory.TYPE.RESOURCE, id, value);
}

InventorySystem.hasEnoughResources = function(actor, id, value) {
    if(value === 0) {
        return true;
    }

    const { inventory } = actor;

    if(!inventory) {
        return false;
    }

    return inventory.has(Inventory.TYPE.RESOURCE, id, value);
}
