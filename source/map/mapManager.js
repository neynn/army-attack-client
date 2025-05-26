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
    this.events.listen(MapManager.EVENT.MAP_ADD);
    this.events.listen(MapManager.EVENT.MAP_REMOVE);
    this.events.listen(MapManager.EVENT.MAP_ENABLE);
    this.events.listen(MapManager.EVENT.MAP_DISABLE);
}

MapManager.EVENT = {
    MAP_ADD: "MAP_ADD",
    MAP_REMOVE: "MAP_REMOVE",
    MAP_ENABLE: "MAP_ENABLE",
    MAP_DISABLE: "MAP_DISABLE"
};

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

MapManager.prototype.removeMap = function(mapID) {
    const loadedMap = this.maps.get(mapID);

    if(!loadedMap) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map is not loaded!", "MapManager.prototype.removeMap", { "mapID": mapID });
        return;
    }

    if(this.activeMap === loadedMap) {
        this.clearActiveMap();
    }

    this.maps.delete(mapID);
    this.events.emit(MapManager.EVENT.MAP_REMOVE, mapID, loadedMap);
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

MapManager.prototype.addMap = function(mapID, worldMap) {
    if(this.maps.has(mapID)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Map already exists!", "MapManager.prototype.addMap", { "mapID": mapID });
        return;
    }

    this.maps.set(mapID, worldMap);
    this.events.emit(MapManager.EVENT.MAP_ADD, mapID, worldMap);
}