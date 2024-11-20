import { Logger } from "../logger.js";
import { GlobalResourceManager } from "../resourceManager.js";

export const MapLoader = function() {
    this.config = {};
    this.mapTypes = {};
    this.loadedMaps = new Map();
    this.activeMapID = null;
}

MapLoader.SUCCESS_TYPE_LOAD = "LOAD";
MapLoader.SUCCESS_TYPE_DEFAULT = "DEFAULT";
MapLoader.ERROR_TYPE_MISSING_TYPE = "MISSING_TYPE";
MapLoader.ERROR_TYPE_MISSING_FILE = "MISSING_FILE";

MapLoader.prototype.load = function(mapTypes, config) {
    if(typeof mapTypes === "object") {
        this.mapTypes = mapTypes;
    } else {
        Logger.log(false, "MapTypes cannot be undefined!", "MapLoader.prototype.load", null);
    }

    if(typeof config === "object") {
        this.config = config;
    } else {
        Logger.log(false, "Config cannot be undefined!", "MapLoader.prototype.load", null);
    }
}

MapLoader.prototype.setActiveMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map is not loaded!", "MapLoader.prototype.setActiveMap", { mapID });

        return false;
    }

    this.activeMapID = mapID;

    return true;
}

MapLoader.prototype.getActiveMap = function() {
    const activeMap = this.loadedMaps.get(this.activeMapID);

    if(!activeMap) {
        return null;
    }

    return activeMap;
}

MapLoader.prototype.getActiveMapID = function() {
    return this.activeMapID;
}

MapLoader.prototype.updateActiveMap = function(mapID) {
    const activeMapID = this.getActiveMapID();
    
    if(activeMapID) {
        if(activeMapID === mapID) {
            Logger.log(false, "Map is already active!", "MapLoader.prototype.updateActiveMap", { mapID });

            return false;
        }
        
        this.removeMap(activeMapID);
    }

    this.setActiveMap(mapID);

    return true;
}

MapLoader.prototype.getMapData = async function(mapID) {
    const mapType = this.getMapType(mapID);

    if(!mapType) {
        Logger.log(false, "MapType does not exist!", "MapLoader.prototype.loadMap", { mapID });
        return {
            "data": null,
            "meta": null,
            "success": false,
            "code": MapLoader.ERROR_TYPE_MISSING_TYPE
        }
    }

    const mapData = await GlobalResourceManager.loadMapData(mapType);

    if(!mapData) {
        return {
            "data": null,
            "meta": mapType,
            "success": false,
            "code": MapLoader.ERROR_TYPE_MISSING_FILE
        }
    }

    return {
        "data": mapData,
        "meta": mapType,
        "success": true,
        "code": MapLoader.SUCCESS_TYPE_LOAD
    }
}

MapLoader.prototype.getMapType = function(mapID) {
    const mapType = this.mapTypes[mapID];

    if(!mapType) {
        Logger.log(false, "MapType does not exist!", "MapLoader.prototype.getMapType", { mapID });

        return null;
    }

    return mapType;
}

MapLoader.prototype.removeMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        Logger.log(false, "Map is not loaded!", "MapLoader.prototype.removeMap", {mapID});

        return false;
    }

    if(this.activeMapID === mapID) {
        this.clearActiveMap();
    }

    this.loadedMaps.delete(mapID);

    return true;
}

MapLoader.prototype.getLoadedMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        return null;
    }

    return loadedMap;
}

MapLoader.prototype.clearAll = function() {
    this.clearLoadedMaps();
    this.clearActiveMap();
}

MapLoader.prototype.clearLoadedMaps = function() {
    this.loadedMaps.clear();
}

MapLoader.prototype.clearActiveMap = function() {
    this.activeMapID = null;
}

MapLoader.prototype.hasLoadedMap = function(mapID) {
    return this.loadedMaps.has(mapID);
}

MapLoader.prototype.getDefaultMapData = function() {
    return {
        "data": this.config.defaultMapSetup,
        "meta": this.config.defaultMapMeta,
        "success": true,
        "code": MapLoader.SUCCESS_TYPE_DEFAULT
    }
}

MapLoader.prototype.addMap = function(mapID, gameMap) {
    if(this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map already exists!", "MapLoader.prototype.addMap", { mapID });
        
        return false;
    }

    this.loadedMaps.set(mapID, gameMap);

    return true;
}

MapLoader.prototype.resizeMap = function(mapID, width, height) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        Logger.log(false, "Map is not loaded!", "MapLoader.prototype.resizeMap", { mapID, width, height });

        return false;
    }

    const defaultSetup = this.config.defaultMapSetup;
    const { layers } = defaultSetup;

    for(const layerID in loadedMap.layers) {
        const layerSetup = layers[layerID];

        if(layerSetup) {
            const { fill } = layerSetup;
            loadedMap.resizeLayer(layerID, width, height, fill);
            continue;
        }

        loadedMap.resizeLayer(layerID, width, height, 0);
    }

    loadedMap.width = width;
    loadedMap.height = height;

    return true;
}
