import { Factory } from "../../source/factory/factory.js";
import { WorldMap } from "../../source/map/worldMap.js";

export const ArmyMapFactory = function() {
    Factory.call(this);
}

ArmyMapFactory.TYPE = {
    "STORY": "STORY",
    "VERSUS": "VERSUS",
}

ArmyMapFactory.prototype = Object.create(Factory.prototype);
ArmyMapFactory.prototype.constructor = Factory;

ArmyMapFactory.prototype.createUint8Layer = function(layerData, width = 0, height = 0) {
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

ArmyMapFactory.prototype.createUint8LayerEmpty = function(fill = 0, width, height) {
    const layerSize = width * height;
    const layerBuffer = new Uint8Array(layerSize);

    for(let i = 0; i < layerSize; i++) {
        layerBuffer[i] = fill;
    }

    return layerBuffer;
}

ArmyMapFactory.prototype.parseMap2D = function(mapID, layerData, meta) {
    const map2D = new WorldMap(mapID);
    const parsedLayers = {};

    const { 
        width = 0,
        height = 0,
        graphics = {}
    } = meta;

    const { 
        layers = {}
    } = graphics;

    for(const layerID in layers) {
        const { id } = layers[layerID];
        const parsedLayerData = this.createUint8Layer(layerData[id], width, height);

        parsedLayers[id] = parsedLayerData;
    }

    map2D.width = width;
    map2D.height = height;
    map2D.setLayers(parsedLayers);
    map2D.meta = JSON.parse(JSON.stringify(meta));
    
    return map2D;
}

ArmyMapFactory.prototype.parseMap2DEmpty = function(mapID, layerData, meta) {
    const map2D = new WorldMap(mapID);
    const parsedLayers = {};

    const { 
        width = 0,
        height = 0,
        graphics = {},
    } = meta;

    const {
        layers = {}
    } = graphics;

    for(const layerID in layers) {
        const { id } = layers[layerID];
        const { fill } = layerData[id];
        const parsedLayerData = this.createUint8LayerEmpty(fill, width, height);

        parsedLayers[id] = parsedLayerData;
    }

    map2D.width = width;
    map2D.height = height;
    map2D.setLayers(parsedLayers);
    map2D.meta = JSON.parse(JSON.stringify(meta));

    return map2D;
}

ArmyMapFactory.prototype.onCreate = function(gameContext, config) {
    const { layers, meta, type } = config;

    if(meta["INTERPRET_AS_EMPTY"]) {
        return this.parseMap2DEmpty(null, layers, meta);
    } else {
        return this.parseMap2D(null, layers, meta);
    }

    switch(type) {
        case ArmyMapFactory.TYPE.STORY: {
            break;
        }
        case ArmyMapFactory.TYPE.VERSUS: {
            break;
        }
        default: {
            console.warn(`MapType ${type} is not supported!`);
            break;
        }
    }
}   