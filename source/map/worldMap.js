import { clampValue } from "../math/math.js";
import { Tracker } from "./tracker.js";

export const WorldMap = function(id) {
    this.id = id;
    this.width = 0;
    this.height = 0;
    this.meta = {};
    this.layers = {};
    this.tracker = new Tracker();
}

WorldMap.prototype.updateArea = function(tileX, tileY, range, onUpdate) {
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

WorldMap.prototype.setID = function(id) {
    this.id = id;
}

WorldMap.prototype.getGraphicsSettings = function() {
    return this.meta.graphics;
}

WorldMap.prototype.setWidth = function(width) {
    this.width = width;
}

WorldMap.prototype.setHeight = function(height) {
    this.height = height;
}

WorldMap.prototype.setLayers = function(graphics) {
    this.layers = graphics;
}

WorldMap.prototype.getLayer = function(layerID) {
    return this.layers[layerID];
}

WorldMap.prototype.getLayers = function() {
    return this.layers;
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
    if(this.layers[layerID] === undefined || opacity === undefined) {
        return;
    }

    const clampedOpacity = clampValue(opacity, 1, 0);
    const layer = this.meta.graphics.layers[layerID];

    layer.opacity = clampedOpacity;
} 

WorldMap.prototype.resize = function(width, height) {
    for(const layerID in this.layers) {
        this.resizeLayer(layerID, width, height, 0);
    }

    this.width = width;
    this.height = height;
}

WorldMap.prototype.resizeLayer = function(layerID, width, height, fill = 0) {
    const oldLayer = this.layers[layerID];

    if(!oldLayer) {
        return;
    }

    const layerSize = width * height;
    const ArrayType = oldLayer.constructor;
    const newLayer = new ArrayType(layerSize);
    
    for(let i = 0; i < layerSize; i++) {
        newLayer[i] = fill;
    }

    for(let i = 0; i < this.height && i < height; i++) {
        const newRow = i * width;
        const oldRow = i * this.width;

        for(let j = 0; j < this.width && j < width; j++) {
            const newIndex = newRow + j;
            const oldIndex = oldRow + j;

            newLayer[newIndex] = oldLayer[oldIndex];
        }
    }

    this.layers[layerID] = newLayer;
}

WorldMap.prototype.clearTile = function(layerID, tileX, tileY) {
    const layer = this.layers[layerID];

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }
    
    const index = tileY * this.width + tileX;

    layer[index] = 0;
}

WorldMap.prototype.placeTile = function(data, layerID, tileX, tileY) {
    const layer = this.layers[layerID];

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return;
    }
    
    if(typeof data !== "number") {
        console.warn(`Data ${data} is not a number! It is ${typeof data}! Returning...`);
        return;
    }

    const index = tileY * this.width + tileX;

    layer[index] = data;
}

WorldMap.prototype.isTileOutOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height;
}

WorldMap.prototype.getTile = function(layerID, tileX, tileY) {
    const layer = this.layers[layerID];
    const isOutOfBounds = this.isTileOutOfBounds(tileX, tileY);

    if(!layer || isOutOfBounds) {
        console.warn(`Layer ${layerID} does not exist or tile ${tileX} ${tileY} is out of bounds! Returning null...`);
        return null;
    }

    const index = tileY * this.width + tileX;

    return layer[index];
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