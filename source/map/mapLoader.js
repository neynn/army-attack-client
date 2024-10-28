import { Logger } from "../logger.js";
import { ResourceLoader } from "../resourceLoader.js";
import { response } from "../response.js";
import { Map2D } from "./map2D.js";

export const MapLoader = function() {
    this.config = {};
    this.mapCache = {};
    this.mapTypes = null;
    this.loadedMaps = new Map();
    this.cachedMaps = new Map();
    this.activeMapID = null;
}

MapLoader.prototype.loadMapTypes = function(mapTypes) {
    if(!mapTypes) {
        return response(false, "MapTypes cannot be undefined!", "MapLoader.prototype.loadMapTypes", null, null);
    }

    this.mapTypes = mapTypes;

    return response(true, "MapTypes have been loaded!", "MapLoader.prototype.loadMapTypes", null, null);
}

MapLoader.prototype.loadConfig = function(config) {
    if(!config) {
        return response(false, "Config cannot be undefined!", "MapLoader.prototype.MapLoader.prototype.loadConfig", null, null);
    }

    this.config = config;

    return response(true, "Config have been loaded!", "MapLoader.prototype.MapLoader.prototype.loadConfig", null, null);
}

MapLoader.prototype.setActiveMap = function(mapID) {
    if(!this.loadedMaps.has(mapID)) {
        return response(false, "Map is not loaded!", "MapLoader.prototype.MapLoader.prototype.setActiveMap", null, {mapID});
    }

    this.activeMapID = mapID;

    return response(true, "Map has been set as active!", "MapLoader.prototype.MapLoader.prototype.setActiveMap", null, {mapID});
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
        response(false, "MapType does not exist!", "loadMapData", null, {mapID});
        return Promise.resolve(null);
    }

    const mapPath = ResourceLoader.getPath(mapType.directory, mapType.source);

    return ResourceLoader.loadJSON(mapPath);
}

MapLoader.prototype.loadMap = function(mapID) {
    const cachedMap = this.cachedMaps.get(mapID);

    if(cachedMap) {
        this.loadedMaps.set(mapID, cachedMap);

        return Promise.resolve(cachedMap);
    }

    return this.loadMapData(mapID).then(mapData => {
        if(!mapData) {
            Logger.log(false, "MapData could not be loaded!", "loadMap", {mapID});

            return null;
        }

        const map2D = new Map2D(mapID, mapData);

        this.loadedMaps.set(mapID, map2D);
        this.cachedMaps.set(mapID, map2D);

        return map2D;
    });
}

MapLoader.prototype.unloadMap = function(mapID) {
    const loadedMap = this.loadedMaps.get(mapID);

    if(!loadedMap) {
        return response(false, "Map is not loaded!", "unloadMap", null, {mapID});
    }

    if(this.activeMapID === mapID) {
        this.clearActiveMap();
    }

    loadedMap.clearTiles();

    this.loadedMaps.delete(mapID);

    return response(true, "Map has been unloaded!", "unloadMap", null, {mapID});
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
    const map2D = new Map2D(mapID, mapSetup);

    this.loadedMaps.set(mapID, map2D);
    this.cachedMaps.set(mapID, map2D);

    return map2D;
}

MapLoader.prototype.createEmptyMap = function(mapID) {
    const mapSetup = JSON.parse(JSON.stringify(this.config.mapSetup));
    const { layers } = mapSetup;
    const map2D = new Map2D(mapID, mapSetup);

    for(const layerID in layers) {
        const layerConfig = layers[layerID];
        const { id, fill } = layerConfig;
        map2D.generateEmptyLayer(id, fill);
    }

    this.loadedMaps.set(mapID, map2D);
    this.cachedMaps.set(mapID, map2D);

    return response(true, "Map has been created!", "createEmptyMap", null, {mapID});;
}

MapLoader.prototype.resizeMap = function(mapID, width, height) {
    const cachedMap = this.cachedMaps.get(mapID);

    if(!cachedMap) {
        return response(false, "Map is not cached!", "MapLoader.prototype.resizeMap", null, {mapID, width, height});
    }

    for(const layerID in cachedMap.layers) {
        const layerSetup = this.config.mapSetup.layers[layerID];

        if(!layerSetup) {
            cachedMap.resizeLayer(layerID, width, height, null);
            continue;
        }

        console.log(layerSetup);
        const { fill } = layerSetup;
        cachedMap.resizeLayer(layerID, width, height, fill);
    }

    cachedMap.width = width;
    cachedMap.height = height;

    return response(true, "Map has been resized!", "MapLoader.prototype.resizeMap", null, {mapID, width, height});
}

MapLoader.prototype.dirtySave = function(gameMapID) {
    const gameMap = this.getCachedMap(gameMapID);

    if(!gameMap) {
        return `{ "ERROR": "NO MAP CACHED! USE CREATE OR LOAD!" }`;
    }

    const { music, width, height, layerOpacity, backgroundLayers, foregroundLayers, metaLayers, layers, entities, flags } = gameMap;
    const copy = { music, width, height, layerOpacity, backgroundLayers, foregroundLayers, metaLayers, layers, entities, flags };

    return JSON.stringify(copy);
}

MapLoader.prototype.saveMap = function(gameMapID) {
    const gameMap = this.getCachedMap(gameMapID);

    if(!gameMap) {
        return `{ "ERROR": "NO MAP CACHED! USE CREATE OR LOAD!" }`;
    }
    
    const stringifyArray = (array) => {
        let result = `[\n            `;
    
        for (let i = 0; i < gameMap.height; i++) {
            let row = ``;
    
            for (let j = 0; j < gameMap.width; j++) {
                const element = array[i * gameMap.width + j];
                const jsonElement = JSON.stringify(element);
                
                row += jsonElement;

                if(j < gameMap.width - 1) {
                    row += `,`
                }
            }
    
            result += row;
    
            if (i < gameMap.height - 1) {
                result += `,\n            `;
            }
        }
    
        result += `\n        ]`;
        
        return result;
    };

    const stringify2DArray = array => {
        if(!array) {
            return null;
        }

        const rows = array.map(row => JSON.stringify(row));
        return `[
            ${rows.join(`,
            `)}
        ]`;
    }

    const formattedEntities = gameMap.entities.map(data => 
        `{ "type": "${data.type}", "tileX": ${data.tileX}, "tileY": ${data.tileY} }`
    ).join(',\n        ');

    const formattedOpacity = Object.keys(gameMap.layerOpacity).map(key => 
        `"${key}": 1`
    ).join(', ');

    const formattedBackground = gameMap.backgroundLayers.map(data =>
        `"${data}"`
    ).join(', ');

    const formattedForeground = gameMap.foregroundLayers.map(data =>
        `"${data}"`
    ).join(', ');

    const formattedMeta = gameMap.metaLayers.map(data =>
        `"${data}"`
    ).join(', ');

    const formattedLayers = Object.keys(gameMap.layers).map(key =>
        `"${key}": ${stringifyArray(gameMap.layers[key])}`
    ).join(',\n        ');

    const downloadableString = 
`{
    "music": "${gameMap.music}",
    "width": ${gameMap.width},
    "height": ${gameMap.height},
    "layerOpacity": { ${formattedOpacity} },
    "backgroundLayers": [ ${formattedBackground} ],
    "foregroundLayers": [ ${formattedForeground} ],
    "metaLayers": [ ${formattedMeta} ],
    "layers": {
        ${formattedLayers}
    },
    "entities" : [
        ${formattedEntities}
    ],
    "flags" : {
        
    }
}`;

    return downloadableString;
}