import { Factory } from "../../source/factory/factory.js";
import { ArmyMap } from "./armyMap.js";

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

ArmyMapFactory.prototype.createBuffer = function(gameContext, width, height) {
    const { tileManager } = gameContext;
    const { meta } = tileManager;
    const bufferSize = width * height;
    const buffer = meta.getCorrectBuffer(bufferSize);

    return buffer;
}

ArmyMapFactory.prototype.parseMap2D = function(gameContext, map2D, meta, layerData) {
    const { 
        width = 0,
        height = 0,
        graphics = {}
    } = meta;

    const { 
        layers = {}
    } = graphics;

    for(const layerID in layers) {
        const config = layers[layerID];
        const buffer = this.createBuffer(gameContext, width, height);
        const layer = map2D.createLayer(layerID, buffer);

        layer.decode(layerData[layerID]);
        layer.init(config);
    }

    map2D.setWidth(width);
    map2D.setHeight(height);
    map2D.loadMeta(meta);
}

ArmyMapFactory.prototype.parseMap2DEmpty = function(gameContext, map2D, meta) {
    const { 
        width = 0,
        height = 0,
        graphics = {},
    } = meta;

    const {
        layers = {}
    } = graphics;

    for(const layerID in layers) {
        const config = layers[layerID];
        const { fill } = config;
        const buffer = this.createBuffer(gameContext, width, height);

        if(fill) {
            for(let i = 0; i < buffer.length; i++) {
                buffer[i] = fill;
            }
        }

        const layer = map2D.createLayer(layerID, buffer);

        layer.init(config);
    }

    map2D.setWidth(width);
    map2D.setHeight(height);
    map2D.loadMeta(meta);
}

ArmyMapFactory.prototype.onCreate = function(gameContext, config) {
    const { meta, layers } = config;
    const { type } = meta;
    const worldMap = new ArmyMap();

    switch(type) {
        case ArmyMapFactory.TYPE.STORY: {
            this.parseMap2D(gameContext, worldMap, meta, layers);
            break;
        }
        case ArmyMapFactory.TYPE.VERSUS: {
            this.parseMap2D(gameContext, worldMap, meta, layers);
            break;
        }
        case ArmyMapFactory.TYPE.EMPTY_STORY: {
            this.parseMap2DEmpty(gameContext, worldMap, meta);
            break;
        }
        case ArmyMapFactory.TYPE.EMPTY_VERUS: {
            this.parseMap2DEmpty(gameContext, worldMap, meta);
            break;
        }
        default: {
            console.warn(`MapType ${type} is not supported!`);
            break;
        }
    }

    return worldMap;
}   