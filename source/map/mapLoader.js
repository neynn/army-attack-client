import { Logger } from "../logger.js";
import { ResourceLoader } from "../resourceLoader.js";
import { Map2D } from "./map2D.js";

export const MapLoader = function() {
    this.config = {};
    this.mapCache = {};
    this.mapTypes = {};
    this.loadedMaps = new Map();
    this.cachedMaps = new Map();
    this.activeMapID = null;
}

MapLoader.prototype.loadMapTypes = function(mapTypes) {
    if(!mapTypes) {
        Logger.log(false, "MapTypes cannot be undefined!", "MapLoader.prototype.loadMapTypes", null);

        return false;
    }

    this.mapTypes = mapTypes;

    return true;
}

MapLoader.prototype.loadConfig = function(config) {
    if(!config) {
        Logger.log(false, "Config cannot be undefined!", "MapLoader.prototype.MapLoader.prototype.loadConfig", null);

        return false;
    }

    this.config = config;

    return true;
}

MapLoader.prototype.setActiveMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        Logger.log(false, "Map is not loaded!", "MapLoader.prototype.MapLoader.prototype.setActiveMap", {mapID});

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

MapLoader.prototype.loadMapData = function(mapID) {
    const mapType = this.mapTypes[mapID];

    if(!mapType) {
        Logger.log(false, "MapType does not exist!", "loadMapData", {mapID});

        return Promise.resolve(null);
    }

    const cachedData = this.cachedMaps.get(mapID);

    if(cachedData) {
        return Promise.resolve(cachedData);
    }

    const mapPath = ResourceLoader.getPath(mapType.directory, mapType.source);
    
    return ResourceLoader.loadJSON(mapPath).then(mapData => {
        if(!mapData) {
            return null;
        }

        if(this.config.mapCacheEnabled) {
            this.cachedMaps.set(mapID, mapData);
        }

        return mapData;
    });
}

MapLoader.prototype.loadMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(loadedMap) {
        return Promise.resolve(loadedMap);
    }

    return this.loadMapData(mapID).then(mapData => {
        if(!mapData) {
            Logger.log(false, "MapData could not be loaded!", "loadMap", {mapID});

            return null;
        }

        return this.createMapFromData(mapID, mapData);
    });
}

MapLoader.prototype.unloadMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        Logger.log(false, "Map is not loaded!", "unloadMap", {mapID});

        return false;
    }

    if(this.activeMapID === mapID) {
        this.clearActiveMap();
    }

    loadedMap.clearTiles();

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

MapLoader.prototype.getCachedMap = function(mapID) {
    const cachedMap = this.cachedMaps.get(mapID);

    if(!cachedMap) {
        return null;
    }

    return cachedMap;
}

MapLoader.prototype.clearAll = function() {
    this.clearLoadedMaps();
    this.clearCache();
    this.clearActiveMap();
}

MapLoader.prototype.clearCache = function() {
    this.cachedMaps.clear();
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

MapLoader.prototype.hasCachedMap = function(mapID) {
    return this.cachedMaps.has(mapID);
}

MapLoader.prototype.createMapFromData = function(mapID, mapData) {
    const mapSetup = JSON.parse(JSON.stringify(mapData));
    const map2D = new Map2D(mapID);

    map2D.initialize(mapSetup);

    this.loadedMaps.set(mapID, map2D);

    return map2D;
}

MapLoader.prototype.createEmptyMap = function(mapID) {
    const mapSetup = JSON.parse(JSON.stringify(this.config.mapSetup));
    const { layers } = mapSetup;
    const map2D = new Map2D(mapID);

    
    map2D.initialize(mapSetup);

    for(const layerID in layers) {
        const layerConfig = layers[layerID];
        const { id, fill } = layerConfig;
        map2D.generateEmptyLayer(id, fill);
    }

    this.loadedMaps.set(mapID, map2D);

    return map2D;
}

MapLoader.prototype.resizeMap = function(mapID, width, height) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        Logger.log(false, "Map is not loaded!", "MapLoader.prototype.resizeMap", {mapID, width, height});

        return false;
    }

    for(const layerID in loadedMap.layers) {
        const layerSetup = this.config.mapSetup.layers[layerID];

        if(!layerSetup) {
            loadedMap.resizeLayer(layerID, width, height, null);
            continue;
        }

        const { fill } = layerSetup;

        loadedMap.resizeLayer(layerID, width, height, fill);
    }

    loadedMap.width = width;
    loadedMap.height = height;

    return true;
}