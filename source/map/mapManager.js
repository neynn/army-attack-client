import { FactoryOwner } from "../factory/factoryOwner.js";
import { Logger } from "../logger.js";
import { JSONManager } from "../resources/jsonManager.js";

export const MapManager = function() {
    FactoryOwner.call(this);

    this.mapTypes = {};
    this.loadedMaps = new Map();
    this.activeMapID = null;
    this.resources = new JSONManager();
}

MapManager.prototype = Object.create(FactoryOwner.prototype);
MapManager.prototype.constructor = MapManager;

MapManager.prototype.load = function(mapTypes) {
    if(typeof mapTypes !== "object") {
        Logger.log(false, "MapTypes cannot be undefined!", "MapManager.prototype.load", null);
        return;
    }

    this.mapTypes = mapTypes;
}

MapManager.prototype.createMap = function(gameContext, mapID, mapData) {
    const worldMap = this.createProduct(gameContext, mapData);

    if(!worldMap) {
        Logger.log(false, "Factory has not returned an entity!", "MapManager.prototype.createMap", { mapData });
        return null;
    }

    worldMap.setID(mapID);

    return worldMap;
}

MapManager.prototype.fetchMapData = async function(mapID) {
    const meta = this.getMapType(mapID);

    if(!meta) {
        Logger.log(false, "MapType does not exist!", "MapManager.prototype.loadMapData", { mapID });
        return null;
    }

    const layers = await this.resources.loadFileData(meta);

    if(!layers) {
        Logger.log(false, "LayersFiles does not exist!", "MapManager.prototype.loadMapData", { mapID });
        return null;
    }

    return {
        "layers": layers,
        "meta": meta
    }
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
        
        this.removeMap(activeMapID);
    }

    this.setActiveMap(mapID);
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
        return;
    }

    if(this.activeMapID === mapID) {
        this.clearActiveMap();
    }

    this.loadedMaps.delete(mapID);
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
        return;
    }

    this.loadedMaps.set(mapID, gameMap);
}