import { ArmyEntity } from "../init/armyEntity.js";
import { ArmyMap } from "../init/armyMap.js";

const MAP_TYPE = {
    NORMAL: "Normal",
    EMPTY: "Empty"
};

const createMap = function(gameContext, mapID, mapData, mapType) {
    const { tileManager } = gameContext;
    const { data = {} } = mapData;
    const containerCount = tileManager.graphics.getContainerCount();
    const worldMap = new ArmyMap(mapID);

    worldMap.init(mapData);

    switch(mapType) {
        case MAP_TYPE.NORMAL: {
            for(const layerID in data) {
                const layer = worldMap.createLayer(layerID);

                layer.initBuffer(containerCount);
                layer.decode(data[layerID]);
            }
            break;
        }
        case MAP_TYPE.EMPTY: {
            for(const layerID in data) {
                const { fill } = data[layerID];
                const layer = worldMap.createLayer(layerID);

                layer.initBuffer(containerCount);
                layer.fill(fill);
            }
            break;
        }
    }

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
    const mapData = await mapManager.fetchMapData(mapID);

    if(!mapData) {
        return null;
    }

    const worldMap = createMap(gameContext, mapID, mapData, MAP_TYPE.NORMAL);

    mapManager.addMap(mapID, worldMap);
    mapManager.setActiveMap(mapID);

    return worldMap;
}

MapSystem.createMapByData = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = createMap(gameContext, mapID, mapData, MAP_TYPE.NORMAL);

    mapManager.addMap(mapID, worldMap);
    mapManager.setActiveMap(mapID);

    return worldMap;
}

MapSystem.createEmptyMap = function(gameContext, mapID, mapData) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = createMap(gameContext, mapID, mapData, MAP_TYPE.EMPTY);

    mapManager.addMap(mapID, worldMap);
    mapManager.setActiveMap(mapID);

    return worldMap;
}