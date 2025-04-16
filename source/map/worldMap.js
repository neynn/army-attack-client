import { Logger } from "../logger.js";
import { clampValue } from "../math/math.js";
import { Autotiler } from "../tile/autotiler.js";
import { TileManager } from "../tile/tileManager.js";
import { Layer } from "./layer.js";
import { Tracker } from "./tracker.js";

export const WorldMap = function() {
    this.width = 0;
    this.height = 0;
    this.flags = 0;
    this.layers = new Map();
    this.tracker = new Tracker();
    this.background = [];
    this.foreground = [];
}

WorldMap.prototype.saveMeta = function() {
    const meta = [];

    for(const [layerID, layer] of this.layers) {
        const { autoGenerate, opacity } = layer;

        meta.push(`"${layerID}": { "opacity": ${opacity}, "autoGenerate": ${autoGenerate} }`);
    }

    return meta;
}

WorldMap.prototype.saveLayers = function() {
    const layers = [];

    for(const [layerID, layer] of this.layers) {
        const { autoGenerate } = layer;

        if(!autoGenerate) {
            layers.push(`"${layerID}": [${layer.encode()}]`);
        }
    }

    return layers;
}

WorldMap.prototype.updateAutotiler = function(gameContext, tileX, tileY, layerID) {
    const startX = tileX - 1;
    const startY = tileY - 1;
    const endX = tileX + 1;
    const endY = tileY + 1;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            this.autotile(gameContext, j, i, layerID);
        }
    }
}

WorldMap.prototype.updateRect = function(tileX, tileY, width, height, onUpdate) {
    if(typeof onUpdate !== "function") {
        return;
    }

    const endX = tileX + width;
    const endY = tileY + height;

    for(let i = tileY; i <= endY; i++) {
        const row = i * this.width;

        for(let j = tileX; j <= endX; j++) {
            const index = row + j;

            onUpdate(index, j, i);
        }
    }
}

WorldMap.prototype.updateArea = function(tileX, tileY, range, onUpdate) {
    if(typeof onUpdate !== "function") {
        return;
    }

    const startX = tileX - range;
    const startY = tileY - range;
    const endX = tileX + range;
    const endY = tileY + range;

    for(let i = startY; i <= endY; i++) {
        const row = i * this.width;

        for(let j = startX; j <= endX; j++) {
            const index = row + j;

            onUpdate(index, j, i);
        }
    }
}

WorldMap.prototype.autotile = function(gameContext, tileX, tileY, layerID) {
    const { tileManager } = gameContext;
    const { meta } = tileManager; 
    const tileID = this.getTile(layerID, tileX, tileY);
    const autotiler = meta.getAutotilerByTile(tileID);

    if(!autotiler) {
        return;
    }

    const responseID = autotiler.run(tileX, tileY, (x, y) => {
        const nextID = this.getTile(layerID, x, y);

        if(autotiler.hasMember(nextID) || nextID === null) {
            return Autotiler.RESPONSE.VALID;
        }

        return Autotiler.RESPONSE.INVALID;
    });

    if(responseID !== TileManager.TILE_ID.EMPTY) {
        this.placeTile(responseID, layerID, tileX, tileY);
    }
}

WorldMap.prototype.loadGraphics = function(background, foreground) {
    for(let i = 0; i < background.length; i++) {
        const layerID = background[i];

        if(this.layers.has(layerID)) {
            this.background.push(background[i]);
        }
    }

    for(let i = 0; i < foreground.length; i++) {
        const layerID = foreground[i];

        if(this.layers.has(layerID)) {
            this.foreground.push(foreground[i]);
        }
    }
}

WorldMap.prototype.getBackgroundLayers = function() {
    return this.background;
}

WorldMap.prototype.getForegroundLayers = function() {
    return this.foreground;
}

WorldMap.prototype.setWidth = function(width) {
    this.width = width;
}

WorldMap.prototype.setHeight = function(height) {
    this.height = height;
}

WorldMap.prototype.createLayer = function(id, buffer) {
    if(this.layers.has(id)) {
        return null;
    }

    const layer = new Layer(buffer);

    this.layers.set(id, layer);

    return layer;
}

WorldMap.prototype.getLayer = function(layerID) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        return null;
    }

    return layer;
}

WorldMap.prototype.getListID = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return -1;
    }

    return tileY * this.width + tileX;
}

WorldMap.prototype.getEntities = function(tileX, tileY) {
    const listID = this.getListID(tileX, tileY);
    const entityList = this.tracker.getList(listID);

    return entityList;
}

WorldMap.prototype.getTopEntity = function(tileX, tileY) {
    const listID = this.getListID(tileX, tileY);
    const topEntity = this.tracker.getTopElement(listID);

    return topEntity;
}

WorldMap.prototype.getBottomEntity = function(tileX, tileY) {
    const listID = this.getListID(tileX, tileY);
    const bottomEntity = this.tracker.getBottomElement(listID);

    return bottomEntity;
}

WorldMap.prototype.isTileOccupied = function(tileX, tileY) {
    const listID = this.getListID(tileX, tileY);
    const isActive = this.tracker.isListActive(listID);

    return isActive;
}

WorldMap.prototype.setLayerOpacity = function(layerID, opacity) {
    const layer = this.layers.get(layerID);

    if(!layer || opacity === undefined) {
        return;
    }

    const clampedOpacity = clampValue(opacity, 1, 0);

    layer.setOpacity(clampedOpacity);
} 

WorldMap.prototype.resizeLayer = function(layerID, width, height, fill) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        return;
    }

    layer.resize(this.width, this.height, width, height, fill);
}

WorldMap.prototype.clearTile = function(layerID, tileX, tileY) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }

    const index = tileY * this.width + tileX;
    
    layer.setItem(0, index);
}

WorldMap.prototype.placeTile = function(data, layerID, tileX, tileY) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    if(typeof data !== "number") {
        console.warn(`Data ${data} is not a number! It is ${typeof data}! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }

    const index = tileY * this.width + tileX;

    layer.setItem(data, index);
}

WorldMap.prototype.isTileOutOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height;
}

WorldMap.prototype.getTile = function(layerID, tileX, tileY) {
    const layer = this.layers.get(layerID);

    if(!layer) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist or tile is out of bounds!", "WorldMap.prototype.getTile", { layerID, tileX, tileY });

        return null;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        Logger.log(Logger.CODE.ENGINE_WARN, "Layer does not exist or tile is out of bounds!", "WorldMap.prototype.getTile", { layerID, tileX, tileY });

        return null;
    }

    const index = tileY * this.width + tileX;
    const item = layer.getItem(index);

    return item;
}

WorldMap.prototype.getUniqueEntitiesInRange = function(startX, startY, endX, endY) {
    const entities = [];
    const addedEntities = new Set();

    for(let i = startY; i < endY; i++) {
        for(let j = startX; j < endX; j++) {
            const entityID = this.getTopEntity(j, i);

            if(!addedEntities.has(entityID)) {
                entities.push(entityID);
                addedEntities.add(entityID)
            }
        }
    }

    return entities;
}

WorldMap.prototype.removeEntity = function(tileX, tileY, rangeX, rangeY, entityID) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const listID = this.getListID(locationX, locationY);

            if(listID !== -1) {
                this.tracker.removeElement(listID, entityID);
            }
        }
    }
}

WorldMap.prototype.addEntity = function(tileX, tileY, rangeX, rangeY, entityID) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const listID = this.getListID(locationX, locationY);

            if(listID !== -1) {
                this.tracker.addElement(listID, entityID);
            }
        }
    }
}