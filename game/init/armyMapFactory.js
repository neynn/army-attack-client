import { Factory } from "../../source/factory/factory.js";
import { ArmyMap } from "./armyMap.js";

export const ArmyMapFactory = function() {
    Factory.call(this, "ARMY_MAP_FACTORY");
}

ArmyMapFactory.TYPE = {
    STORY: "Story",
    VERSUS: "Versus",
    EMPTY_STORY: "EmptyStory",
    EMPTY_VERUS: "EmptyVersus"
};

ArmyMapFactory.prototype = Object.create(Factory.prototype);
ArmyMapFactory.prototype.constructor = Factory;

const createBuffer = function(gameContext, width, height) {
    const { tileManager } = gameContext;
    const { graphics } = tileManager;
    const bufferSize = width * height;
    const BufferType = graphics.getBufferType(bufferSize);
    const buffer = new BufferType(bufferSize);

    return buffer;
}

const parseMap2D = function(gameContext, map2D, config) {
    const { 
        width = 0,
        height = 0,
        graphics = {},
        data = {}
    } = config;

    const { 
        layers = {}
    } = graphics;

    for(const layerID in layers) {
        const config = layers[layerID];
        const buffer = createBuffer(gameContext, width, height);
        const layer = map2D.createLayer(layerID, buffer);

        layer.decode(data[layerID]);
        layer.init(config);
    }

    map2D.setWidth(width);
    map2D.setHeight(height);
    map2D.loadMeta(config);
}

const parseMap2DEmpty = function(gameContext, map2D, config) {
    const { 
        width = 0,
        height = 0,
        graphics = {},
    } = config;

    const {
        layers = {}
    } = graphics;

    for(const layerID in layers) {
        const config = layers[layerID];
        const { fill } = config;
        const buffer = createBuffer(gameContext, width, height);

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
    map2D.loadMeta(config);
}

ArmyMapFactory.prototype.onCreate = function(gameContext, config) {
    const { type } = config;
    const worldMap = new ArmyMap();

    switch(type) {
        case ArmyMapFactory.TYPE.STORY: {
            parseMap2D(gameContext, worldMap, config);
            break;
        }
        case ArmyMapFactory.TYPE.VERSUS: {
            parseMap2D(gameContext, worldMap, config);
            break;
        }
        case ArmyMapFactory.TYPE.EMPTY_STORY: {
            parseMap2DEmpty(gameContext, worldMap, config);
            break;
        }
        case ArmyMapFactory.TYPE.EMPTY_VERUS: {
            parseMap2DEmpty(gameContext, worldMap, config);
            break;
        }
        default: {
            console.warn(`MapType ${type} is not supported!`);
            break;
        }
    }

    return worldMap;
}   