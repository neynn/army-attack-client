import { EventEmitter } from "../events/eventEmitter.js";
import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";
import { JSONManager } from "../resources/jsonManager.js";

export const MapManager = function() {
    FactoryOwner.call(this);

    this.mapTypes = {};
    this.loadedMaps = new Map();
    this.activeMapID = null;
    this.resources = new JSONManager();
    this.resources.enableCache();

    this.events = new EventEmitter();
    this.events.listen(MapManager.EVENT.MAP_CREATE);
    this.events.listen(MapManager.EVENT.MAP_DESTROY);
}

MapManager.EVENT = {
    MAP_CREATE: "MAP_CREATE",
    MAP_DESTROY: "MAP_DESTROY"
};

MapManager.prototype = Object.create(FactoryOwner.prototype);
MapManager.prototype.constructor = MapManager;

MapManager.prototype.update = function(gameContext) {
    this.loadedMaps.forEach(worldMap => worldMap.update(gameContext));
}

MapManager.prototype.createMapByID = async function(gameContext, mapID) {
    const mapData = await this.fetchMapData(mapID);

    if(!mapData) {
        Logger.log(Logger.CODE.ENGINE_ERROR, "MapData does not exist!", "MapManager.prototype.createMapByID", { "mapID": mapID });
        return null;
    }

    const worldMap = this.createMap(gameContext, mapID, mapData);

    return worldMap;
}

MapManager.prototype.createMap = function(gameContext, mapID, mapData) {
    const worldMap = this.createProduct(gameContext, mapData);

    if(!worldMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map could not be created!", "MapManager.prototype.createMap", { "mapID": mapID });
        return null;
    }

    this.addMap(mapID, worldMap);
    this.updateActiveMap(mapID);
    this.events.emit(MapManager.EVENT.MAP_CREATE, mapID, mapData, worldMap);

    return worldMap;
}

MapManager.prototype.load = function(mapTypes) {
    if(typeof mapTypes !== "object") {
        Logger.log(false, "MapTypes cannot be undefined!", "MapManager.prototype.load", null);
        return;
    }

    this.mapTypes = mapTypes;
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
    if(!this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map is not loaded!", "MapManager.prototype.setActiveMap", { mapID });
        return;
    }

    this.activeMapID = mapID;
}

MapManager.prototype.getActiveMap = function() {
    const activeMap = this.loadedMaps.get(this.activeMapID);

    if(!activeMap) {
        return null;
    }

    return activeMap;
}

MapManager.prototype.getActiveMapID = function() {
    return this.activeMapID;
}

MapManager.prototype.updateActiveMap = function(mapID) {
    const activeMapID = this.getActiveMapID();
    
    if(activeMapID) {
        if(activeMapID === mapID) {
            Logger.log(false, "Map is already active!", "MapManager.prototype.updateActiveMap", { mapID });
            return;
        }
        
        this.destroyMap(activeMapID);
    }

    this.setActiveMap(mapID);
}

MapManager.prototype.getMapType = function(mapID) {
    const mapType = this.mapTypes[mapID];

    if(!mapType) {
        Logger.log(Logger.CODE.ENGINE_WARN, "MapType does not exist!", "MapManager.prototype.getMapType", { mapID });
        return null;
    }

    return mapType;
}

MapManager.prototype.destroyMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map is not loaded!", "MapManager.prototype.destroyMap", { "mapID": mapID });
        return;
    }

    if(this.activeMapID === mapID) {
        this.activeMapID = null;
    }

    this.loadedMaps.delete(mapID);
    this.events.emit(MapManager.EVENT.MAP_DESTROY, mapID);
}

MapManager.prototype.getLoadedMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        return null;
    }

    return loadedMap;
}

MapManager.prototype.exit = function() {
    this.events.muteAll();
    this.loadedMaps.clear();
    this.activeMapID = null;
}

MapManager.prototype.hasLoadedMap = function(mapID) {
    return this.loadedMaps.has(mapID);
}

MapManager.prototype.addMap = function(mapID, gameMap) {
    if(this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map already exists!", "MapManager.prototype.addMap", { mapID });
        return;
    }

    this.loadedMaps.set(mapID, gameMap);
}