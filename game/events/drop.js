import { ArmyEvent } from "./armyEvent.js";

export const DropEvent = function() {}

DropEvent.prototype = Object.create(ArmyEvent.prototype);
DropEvent.prototype.constructor = DropEvent;

DropEvent.prototype.onStory = function(gameContext, event) {
    const { world } = gameContext;
    const { turnManager, mapManager } = world;
    const { dropContainer, receiverID } = event;
    const receiver = turnManager.getActor(receiverID);

    if(!receiver || !receiver.inventory) {
        return;
    }
    
    const worldMap = mapManager.getActiveMap();
    
    if(worldMap) {
        worldMap.drops.createDrops(gameContext, dropContainer, receiver.inventory);
    }
}

DropEvent.createEvent = function(receiverID, dropContainer) {
    return {
        "receiverID": receiverID,
        "dropContainer": dropContainer
    }
}