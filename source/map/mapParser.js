import { WorldMap } from "./worldMap.js";

export const MapParser = function() {}

MapParser.createUint8Layer = function(layerData, width = 0, height = 0) {
    const layerSize = width * height;
    const layerBuffer = new Uint8Array(layerSize);

    if(!layerData) {
        return layerBuffer;
    }

    if(layerData.length < layerSize) {
        for(let i = 0; i < layerData.length; i++) {
            const tileID = layerData[i];
            layerBuffer[i] = tileID;
        }

        return layerBuffer;
    }

    for(let i = 0; i < layerSize; i++) {
        const tileID = layerData[i];
        layerBuffer[i] = tileID;
    }

    return layerBuffer;
}

MapParser.createUint8LayerEmpty = function(fill = 0, width, height) {
    const layerSize = width * height;
    const layerBuffer = new Uint8Array(layerSize);

    for(let i = 0; i < layerSize; i++) {
        layerBuffer[i] = fill;
    }

    return layerBuffer;
}

MapParser.parseMap2D = function(mapID, layers, meta) {
    const map2D = new WorldMap(mapID);
    const parsedLayers = {};

    const { 
        width = 0,
        height = 0,
        layerConfig = {}
    } = meta;

    for(const layerID in layerConfig) {
        const { id } = layerConfig[layerID];
        const layerData = layers[id];
        const parsedLayerData = MapParser.createUint8Layer(layerData, width, height);

        parsedLayers[id] = parsedLayerData;
    }

    map2D.width = width;
    map2D.height = height;
    map2D.setLayers(parsedLayers);
    map2D.meta = JSON.parse(JSON.stringify(meta));
    
    return map2D;
}

MapParser.parseMap2DEmpty = function(mapID, layers, meta) {
    const map2D = new WorldMap(mapID);
    const parsedLayers = {};

    const { 
        width = 0,
        height = 0,
        layerConfig = {},
    } = meta;

    for(const layerID in layerConfig) {
        const { id } = layerConfig[layerID];
        const { fill } = layers[id];
        const parsedLayerData = MapParser.createUint8LayerEmpty(fill, width, height);

        parsedLayers[id] = parsedLayerData;
    }

    map2D.width = width;
    map2D.height = height;
    map2D.setLayers(parsedLayers);
    map2D.meta = JSON.parse(JSON.stringify(meta));

    return map2D;
}