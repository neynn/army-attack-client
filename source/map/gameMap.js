import { clampValue } from "../math/math.js";

export const GameMap = function(id) {
    this.id = id;
    this.width = 0;
    this.height = 0;
    this.meta = {};
    this.layers = {};
    this.usedTiles = new Map();
}

GameMap.prototype.getID = function() {
    return this.id;
}

GameMap.prototype.setPointer = function(entityID, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return false;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.usedTiles.get(index);
    
    if(!entityList) {
        this.usedTiles.set(index, new Set([entityID]));
    } else {
        entityList.add(entityID);
    }

    return true;
}

GameMap.prototype.removePointer = function(entityID, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return false;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.usedTiles.get(index);

    if(!entityList) {
        return false;
    }

    entityList.delete(entityID);

    if(entityList.size === 0) {
        this.usedTiles.delete(index);
    }

    return true;
}

GameMap.prototype.getEntityList = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.usedTiles.get(index);

    if(!entityList) {
        return null;
    }

    return entityList;
}

GameMap.prototype.getFirstEntity = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.usedTiles.get(index);

    if(!entityList) {
        return null;
    }

    const iterator = entityList.values();
    const firstEntity = iterator.next().value;
    
    return firstEntity;
}

GameMap.prototype.isTileOccupied = function(tileX, tileY) {
    const index = tileY * this.width + tileX;
    const isOccupied = this.usedTiles.has(index) && this.usedTiles.get(index).size > 0;

    return isOccupied;
}

GameMap.prototype.getAutoGeneratingLayers = function() {
    const layerIDs = new Set();

    for(const layerConfig of this.meta.backgroundLayers) {
        const { id, autoGenerate } = layerConfig;

        if(autoGenerate) {
            layerIDs.add(id);
        }
    }

    for(const layerConfig of this.meta.foregroundLayers) {
        const { id, autoGenerate } = layerConfig;

        if(autoGenerate) {
            layerIDs.add(id);
        }
    }

    for(const layerConfig of this.meta.metaLayers) {
        const { id, autoGenerate } = layerConfig;

        if(autoGenerate) {
            layerIDs.add(id);
        }
    }

    return layerIDs;
}

GameMap.prototype.setLayerOpacity = function(layerID, opacity) {
    if(this.layers[layerID] === undefined || opacity === undefined) {
        return false;
    }

    opacity = clampValue(opacity, 1, 0);

    for(const layerConfig of this.meta.backgroundLayers) {
        const { id } = layerConfig;

        if(id === layerID) {
            layerConfig.opacity = opacity;

            return true;
        }
    }

    for(const layerConfig of this.meta.foregroundLayers) {
        const { id } = layerConfig;

        if(id === layerID) {
            layerConfig.opacity = opacity;

            return true;
        }
    }

    for(const layerConfig of this.meta.metaLayers) {
        const { id } = layerConfig;

        if(id === layerID) {
            layerConfig.opacity = opacity;

            return true;
        }
    }

    return false;
} 

GameMap.prototype.resize = function(width, height) {
    for(const layerID in this.layers) {
        this.resizeLayer(layerID, width, height, 0);
    }

    this.width = width;
    this.height = height;
}

GameMap.prototype.resizeLayer = function(layerID, width, height, fill = 0) {
    const oldLayer = this.layers[layerID];

    if(!oldLayer) {
        return false;
    }

    const layerSize = width * height;
    const ArrayType = oldLayer.constructor;
    const newLayer = new ArrayType(layerSize);
    
    for(let i = 0; i < layerSize; i++) {
        newLayer[i] = fill;
    }

    for(let i = 0; i < this.height; i++) {
        if(i >= height) {
            break;
        }

        const newRow = i * width;
        const oldRow = i * this.width;

        for(let j = 0; j < this.width; j++) {
            if(j >= width) {
                break;
            }

            const newIndex = newRow + j;
            const oldIndex = oldRow + j;

            newLayer[newIndex] = oldLayer[oldIndex];
        }
    }

    this.layers[layerID] = newLayer;
}

GameMap.prototype.clearTile = function(layerID, tileX, tileY) {
    const layer = this.layers[layerID];

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);
        return false;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);
        return false;
    }
    
    const index = tileY * this.width + tileX;

    layer[index] = 0;

    return true;
}

GameMap.prototype.placeTile = function(data, layerID, tileX, tileY) {
    const layer = this.layers[layerID];

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning...`);

        return false;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} does not exist! Returning...`);

        return false;
    }
    
    if(typeof data !== "number") {
        console.warn(`Data ${data} is not a number! It is ${typeof data}! Returning...`);

        return false;
    }

    const index = tileY * this.width + tileX;

    layer[index] = data;

    return true;
}

GameMap.prototype.isTileOutOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height;
}

GameMap.prototype.getTile = function(layerID, tileX, tileY) {
    const layer = this.layers[layerID];

    if(!layer) {
        console.warn(`Layer ${layerID} does not exist! Returning null...`);

        return null;
    }

    if(this.isTileOutOfBounds(tileX, tileY)) {
        console.warn(`Tile ${tileY},${tileX} of layer ${layerID} does not exist! Returning null...`);

        return null;
    }

    const index = tileY * this.width + tileX;

    return layer[index];
}

GameMap.prototype.removeEntity = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;

            this.removePointer(pointer, locationX, locationY);
        }
    }
}

GameMap.prototype.addEntity = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;

            this.setPointer(pointer, locationX, locationY);
        }
    }
}

GameMap.prototype.updateTiles = function(onUpdate) {
    for(let i = 0; i < this.height; i++) {
        const row = i * this.width;

        for(let j = 0; j < this.width; j++) {
            const index = row + j;

            onUpdate(index, j, i);
        }
    }
}