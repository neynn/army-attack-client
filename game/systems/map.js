import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";

const createMap = function(id, data) {
    const worldMap = new ArmyMap(id);

    worldMap.init(data);

    return worldMap;
}

export const MapSystem = function() {}

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

MapSystem.createMapByID = async function(gameContext, mapID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = await mapManager.createMapByID(gameContext, mapID, createMap);

    mapManager.setActiveMap(mapID);

    return worldMap;
}

MapSystem.createMapByData = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapData.createMapByData(gameContext, mapID, mapData, createMap);

    mapManager.setActiveMap(mapID);

    return worldMap;
}

MapSystem.createEmptyMap = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.createEmptyMap(gameContext, mapID, mapData, createMap);

    mapManager.setActiveMap(mapID);

    return worldMap;
}