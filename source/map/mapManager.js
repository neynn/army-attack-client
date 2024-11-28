import { Logger } from "../logger.js";
import { JSONManager } from "../resources/jsonManager.js";

export const MapManager = function() {
    this.mapTypes = {};
    this.loadedMaps = new Map();
    this.activeMapID = null;
    this.resources = new JSONManager();
}

MapManager.prototype.load = function(mapTypes) {
    if(typeof mapTypes === "object") {
        this.mapTypes = mapTypes;
    } else {
        Logger.log(false, "MapTypes cannot be undefined!", "MapManager.prototype.load", null);
    }
}

MapManager.prototype.parseMap = async function(mapID, onParse) {
    const mapType = this.getMapType(mapID);

    if(!mapType) {
        Logger.log(false, "MapType does not exist!", "MapManager.prototype.parseMap", { mapID });
        return null;
    }

    const mapData = await this.resources.loadFileData(mapType);

    if(!mapData) {
        return null;
    }

    const parsedMap = onParse(mapID, mapData, mapType);

    return parsedMap;
}

MapManager.prototype.setActiveMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map is not loaded!", "MapManager.prototype.setActiveMap", { mapID });

        return false;
    }

    this.activeMapID = mapID;

    return true;
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

            return false;
        }
        
        this.removeMap(activeMapID);
    }

    this.setActiveMap(mapID);

    return true;
}

MapManager.prototype.getMapType = function(mapID) {
    const mapType = this.mapTypes[mapID];

    if(!mapType) {
        Logger.log(false, "MapType does not exist!", "MapManager.prototype.getMapType", { mapID });

        return null;
    }

    return mapType;
}

MapManager.prototype.removeMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        Logger.log(false, "Map is not loaded!", "MapManager.prototype.removeMap", {mapID});

        return false;
    }

    if(this.activeMapID === mapID) {
        this.clearActiveMap();
    }

    this.loadedMaps.delete(mapID);

    return true;
}

MapManager.prototype.getLoadedMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        return null;
    }

    return loadedMap;
}

MapManager.prototype.clearAll = function() {
    this.clearLoadedMaps();
    this.clearActiveMap();
}

MapManager.prototype.clearLoadedMaps = function() {
    this.loadedMaps.clear();
}

MapManager.prototype.clearActiveMap = function() {
    this.activeMapID = null;
}

MapManager.prototype.hasLoadedMap = function(mapID) {
    return this.loadedMaps.has(mapID);
}

MapManager.prototype.addMap = function(mapID, gameMap) {
    if(this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map already exists!", "MapManager.prototype.addMap", { mapID });
        
        return false;
    }

    this.loadedMaps.set(mapID, gameMap);

    return true;
}