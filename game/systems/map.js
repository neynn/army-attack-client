import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";

/**
 * Creates and returns a new ArmyMap
 * 
 * @param {string} id 
 * @param {{}} data 
 * @returns {ArmyMap}
 */
const createMap = function(gameContext, id, data) {
    const worldMap = new ArmyMap(id);

    worldMap.init(gameContext, data);

    return worldMap;
}

/**
 * Collections of functions revolving around the world maps.
 */
export const MapSystem = function() {}

/**
 * Placed an entity on the current world map.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
MapSystem.placeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const entityID = entity.getID();
        const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

        worldMap.addEntity(tileX, tileY, entity.config.dimX, entity.config.dimY, entityID);
    }
}

/**
 * Removes an entity from the current world map.
 * 
 * @param {*} gameContext 
 * @param {*} entity 
 */
MapSystem.removeEntity = function(gameContext, entity) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getActiveMap();

    if(worldMap) {
        const entityID = entity.getID();
        const { tileX, tileY } = entity.getComponent(ArmyEntity.COMPONENT.POSITION);

        worldMap.removeEntity(tileX, tileY, entity.config.dimX, entity.config.dimY, entityID);
    }
}

/**
 * Creates a world map by specifying the id.
 * 
 * @param {*} gameContext 
 * @param {string} mapID 
 * @returns 
 */
MapSystem.createMapByID = async function(gameContext, mapID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = await mapManager.createMapByID(gameContext, mapID, createMap);

    mapManager.setActiveMap(mapID);

    return worldMap;
}

/**
 * Creates a world map by specifying the id and data.
 * 
 * @param {*} gameContext 
 * @param {string} mapID 
 * @param {{}} mapData 
 * @returns 
 */
MapSystem.createMapByData = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.createMapByData(gameContext, mapID, mapData, createMap);

    mapManager.setActiveMap(mapID);

    return worldMap;
}

/**
 * Creates an empty world map by specifying the id and data.
 * 
 * @param {*} gameContext 
 * @param {string} mapID 
 * @param {{}} mapData 
 * @returns 
 */
MapSystem.createEmptyMap = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.createEmptyMap(gameContext, mapID, mapData, createMap);

    mapManager.setActiveMap(mapID);

    return worldMap;
}