import { Factory } from "../../source/factory/factory.js";
import { ArmyMap } from "./armyMap.js";

export const ArmyMapFactory = function() {
    Factory.call(this, "ARMY_MAP_FACTORY");
}

const MAP_TYPE = {
    STORY: "Story",
    VERSUS: "Versus",
    EMPTY_STORY: "EmptyStory",
    EMPTY_VERUS: "EmptyVersus"
};

ArmyMapFactory.prototype = Object.create(Factory.prototype);
ArmyMapFactory.prototype.constructor = Factory;

const parseMap2D = function(gameContext, map2D, config) {
    const { tileManager } = gameContext;
    const containerCount = tileManager.graphics.getContainerCount();

    const {
        data = {}
    } = config;

    map2D.init(config);

    for(const layerID in data) {
        const layer = map2D.createLayer(layerID);

        layer.initBuffer(containerCount);
        layer.decode(data[layerID]);
    }
}

const parseMap2DEmpty = function(gameContext, map2D, config) {
    const { tileManager } = gameContext;
    const containerCount = tileManager.graphics.getContainerCount();

    const { 
        data = {}
    } = config;

    map2D.init(config);
    
    for(const layerID in data) {
        const { fill } = data[layerID];
        const layer = map2D.createLayer(layerID);

        layer.initBuffer(containerCount);
        layer.fill(fill);
    }
}

ArmyMapFactory.prototype.onCreate = function(gameContext, config) {
    const { type } = config;
    const worldMap = new ArmyMap();

    switch(type) {
        case MAP_TYPE.STORY: {
            parseMap2D(gameContext, worldMap, config);
            break;
        }
        case MAP_TYPE.VERSUS: {
            parseMap2D(gameContext, worldMap, config);
            break;
        }
        case MAP_TYPE.EMPTY_STORY: {
            parseMap2DEmpty(gameContext, worldMap, config);
            break;
        }
        case MAP_TYPE.EMPTY_VERUS: {
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