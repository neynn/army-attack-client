import { Factory } from "../../source/factory/factory.js";
import { WorldMap } from "../../source/map/worldMap.js";

export const ArmyMapFactory = function() {
    Factory.call(this, "ARMY_MAP_FACTORY");
}

ArmyMapFactory.TYPE = {
    "STORY": "Story",
    "VERSUS": "Versus",
    "EMPTY_STORY": "EmptyStory",
    "EMPTY_VERUS": "EmptyVersus"
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

ArmyMapFactory.prototype.parseMap2D = function(map2D, layerData, meta) {
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

ArmyMapFactory.prototype.parseMap2DEmpty = function(map2D, layerData, meta) {
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
    const { meta, layers } = config;
    const { type } = meta;
    const worldMap = new WorldMap(null);

    switch(type) {
        case ArmyMapFactory.TYPE.STORY: {
            this.parseMap2D(worldMap, layers, meta);
            break;
        }
        case ArmyMapFactory.TYPE.VERSUS: {
            this.parseMap2D(worldMap, layers, meta);
            break;
        }
        case ArmyMapFactory.TYPE.EMPTY_STORY: {
            this.parseMap2DEmpty(worldMap, layers, meta);
            break;
        }
        case ArmyMapFactory.TYPE.EMPTY_VERUS: {
            this.parseMap2DEmpty(worldMap, layers, meta);
            break;
        }
        default: {
            console.warn(`MapType ${type} is not supported!`);
            break;
        }
    }

    return worldMap;
}   