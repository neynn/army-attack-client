import { GameEvent } from "./gameEvent.js";
import { SpawnSystem } from "./systems/spawn.js";

export const DebugHelper = function() {}

DebugHelper.killAllEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;

    entityManager.forAllEntities((entityID, entity) => eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { entity }));
}

DebugHelper.spawnFullEntities = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { width, height } = worldMap;

    for(let i = 0; i < height; i++) {
        for(let j = 0; j < width; j++) {
            SpawnSystem.createEntity(gameContext, {
                "type": "red_battletank",
                "team": "Crimson",
                "tileX": j,
                "tileY": i
            });     
        }
    }
}