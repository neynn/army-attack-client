import { GameEvent } from "../gameEvent.js";

export const DebrisSystem = function() {}

DebrisSystem.endCleaning = function(gameContext, tileX, tileY, cleanerID) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.removeDebris(tileX, tileY);
    eventBus.emit(GameEvent.TYPE.DEBRIS_REMOVED, { tileX, tileY, cleanerID });
}

DebrisSystem.spawnDebris = function(gameContext, debris) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    for(let i = 0; i < debris.length; i++) {
        const { x, y } = debris[i];

        worldMap.addDebris(1, x, y);
    }
}