import { DefaultTypes } from "../defaultTypes.js";
import { GameEvent } from "../gameEvent.js";
import { SpawnSystem } from "./spawn.js";

/**
 * Collection of functions revolving around debugging.
 */
export const DebugSystem = function() {}

/**
 * Emits a death event for all entities.
 * 
 * @param {*} gameContext 
 */
DebugSystem.killAllEntities = function(gameContext) {
    const { world } = gameContext;
    const { entityManager, eventBus } = world;

    entityManager.forAllEntities((entityID, entity) => eventBus.emit(GameEvent.TYPE.ENTITY_DEATH, { entity }));
}

/**
 * Spawns an entity for every tile of the map.
 * 
 * @param {*} gameContext 
 * @returns 
 */
DebugSystem.spawnFullEntities = function(gameContext) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(!worldMap) {
        return;
    }

    const { width, height } = worldMap;

    for(let i = 0; i < height; i++) {
        for(let j = 0; j < width; j++) {
            SpawnSystem.createEntity(gameContext, DefaultTypes.createSpawnConfig("red_battletank", "Crimson", [], j, i));     
        }
    }
}