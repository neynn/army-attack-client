import { EventEmitter } from "../events/eventEmitter.js";
import { JSONManager } from "../resources/jsonManager.js";
import { Logger } from "../logger.js";

export const MapManager = function() {
    this.mapTypes = {};
    this.maps = new Map();
    this.activeMap = null;
    this.resources = new JSONManager();
    this.resources.enableCache();

    this.events = new EventEmitter();
    this.events.listen(MapManager.EVENT.MAP_CREATE);
    this.events.listen(MapManager.EVENT.MAP_DELETE);
    this.events.listen(MapManager.EVENT.MAP_ENABLE);
    this.events.listen(MapManager.EVENT.MAP_DISABLE);
}

MapManager.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    MAP_DELETE: "MAP_DELETE",
    MAP_ENABLE: "MAP_ENABLE",
    MAP_DISABLE: "MAP_DISABLE"
};

MapManager.MAP_TYPE = {
    EMPTY: 0,
    NORMAL: 1
};

MapManager.prototype.createMapByID = async function(gameContext, mapID, onMapCreate) {
    if(this.maps.has(mapID)) {
        return null;
    }
    
    const mapData = await this.fetchMapData(mapID);

    if(!mapData) {
        return null;
    }

    const { data } = mapData;
    const worldMap = onMapCreate(gameContext, mapID, mapData);

    if(data) {
        this.loadLayers(gameContext, worldMap, data, MapManager.MAP_TYPE.NORMAL);
    }

    this.maps.set(mapID, worldMap);
    this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, mapData, worldMap);

    return worldMap;
}

MapManager.prototype.createMapByData = function(gameContext, mapID, mapData, onMapCreate) {
    if(this.maps.has(mapID)) {
        return null;
    }

    const { data } = mapData;
    const worldMap = onMapCreate(gameContext, mapID, mapData);

    if(data) {
        this.loadLayers(gameContext, worldMap, data, MapManager.MAP_TYPE.NORMAL);
    }

    this.maps.set(mapID, worldMap);
    this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, mapData, worldMap);

    return worldMap;
} 

MapManager.prototype.createEmptyMap = function(gameContext, mapID, mapData, onMapCreate) {
    if(this.maps.has(mapID)) {
        return null;
    }

    const { data } = mapData;
    const worldMap = onMapCreate(gameContext, mapID, mapData);

    if(data) {
        this.loadLayers(gameContext, worldMap, data, MapManager.MAP_TYPE.EMPTY);
    }

    this.maps.set(mapID, worldMap);
    this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, mapData, worldMap);

    return worldMap;
}

MapManager.prototype.loadLayers = function(gameContext, worldMap, data, mapType) {
    const { tileManager } = gameContext;
    const containerCount = tileManager.graphics.getContainerCount();

    switch(mapType) {
        case MapManager.MAP_TYPE.NORMAL: {
            for(const layerID in data) {
                const layer = worldMap.createLayer(layerID);

                layer.initBuffer(containerCount);
                layer.decode(data[layerID]);
            }
            break;
        }
        case MapManager.MAP_TYPE.EMPTY: {
            for(const layerID in data) {
                const { fill } = data[layerID];
                const layer = worldMap.createLayer(layerID);

                layer.initBuffer(containerCount);
                layer.fill(fill);
            }
            break;
        }
    }
}

MapManager.prototype.update = function(gameContext) {
    if(this.activeMap) {
        this.activeMap.update(gameContext);
    }
}

MapManager.prototype.load = function(mapTypes) {
    if(typeof mapTypes !== "object") {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapTypes cannot be undefined!", "MapManager.prototype.load", null);
        return;
    }

    this.mapTypes = mapTypes;
}

MapManager.prototype.forAllMaps = function(onCall) {
    if(typeof onCall !== "function") {
        return;
    }

    this.maps.forEach((map) => {
        const mapID = map.getID();

        onCall(mapID, map);
    });
}

MapManager.prototype.fetchMapData = async function(mapID) {
    const mapType = this.getMapType(mapID);

    if(!mapType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapType does not exist!", "MapManager.prototype.loadMapData", { "mapID": mapID });
        return null;
    }

    const { directory, source } = mapType;
    const mapData = await this.resources.loadFileData(mapID, directory, source);

    if(!mapData) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapData does not exist!", "MapManager.prototype.loadMapData", { "mapID": mapID });
        return null;
    }

    return mapData;
}

MapManager.prototype.setActiveMap = function(mapID) {
    const worldMap = this.maps.get(mapID);

    if(!worldMap || worldMap === this.activeMap) {
        return;
    }

    if(this.activeMap && this.activeMap !== worldMap) {
        this.clearActiveMap();
    }

    this.activeMap = worldMap;
    this.events.emit(MapManager.EVENT.MAP_ENABLE, mapID, worldMap);
}

MapManager.prototype.getActiveMap = function() {
    return this.activeMap;
}

MapManager.prototype.getMapType = function(mapID) {
    const mapType = this.mapTypes[mapID];

    if(!mapType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapType does not exist!", "MapManager.prototype.getMapType", { mapID });
        return null;
    }

    return mapType;
}

MapManager.prototype.deleteMap = function(mapID) {
    const loadedMap = this.maps.get(mapID);

    if(!loadedMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map is not loaded!", "MapManager.prototype.deleteMap", { "mapID": mapID });
        return;
    }

    if(this.activeMap === loadedMap) {
        this.clearActiveMap();
    }

    this.maps.delete(mapID);
    this.events.emit(MapManager.EVENT.MAP_DELETE, mapID, loadedMap);
}

MapManager.prototype.getLoadedMap = function(mapID) {
    const loadedMap = this.maps.get(mapID);

    if(!loadedMap) {
        return null;
    }

    return loadedMap;
}

MapManager.prototype.clearActiveMap = function() {
    if(this.activeMap) {
        const mapID = this.activeMap.getID();

        this.events.emit(MapManager.EVENT.MAP_DISABLE, mapID, this.activeMap);
    }

    this.activeMap = null;
}

MapManager.prototype.exit = function() {
    this.events.muteAll();
    this.maps.clear();
    this.clearActiveMap();
}