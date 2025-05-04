import { GameEvent } from "../gameEvent.js";

export const DebrisSystem = function() {}

DebrisSystem.endCleaning = function(gameContext, tileX, tileY, cleanerID) {
    const { world } = gameContext;
    const { mapManager, eventBus } = world;
    const worldMap = mapManager.getActiveMap();

    worldMap.removeDebris(tileX, tileY);
    eventBus.emit(GameEvent.TYPE.DEBRIS_REMOVED, { tileX, tileY, cleanerID });
}
