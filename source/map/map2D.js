import { clampValue } from "../math/math.js";

export const Map2D = function(id) {
    this.id = id;
    this.music = null;
    this.width = 0;
    this.height = 0;
    this.layers = {};
    this.backgroundLayers = [];
    this.foregroundLayers = [];
    this.metaLayers = [];
    this.entities = [];
    this.flags = {};
    this.entityTiles = new Map();
}

Map2D.prototype.getID = function() {
    return this.id;
}

Map2D.prototype.setPointer = function(entityID, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return false;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.entityTiles.get(index);
    
    if(!entityList) {
        this.entityTiles.set(index, new Set([entityID]));
    } else {
        entityList.add(entityID);
    }

    return true;
}

Map2D.prototype.removePointer = function(entityID, tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return false;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.entityTiles.get(index);

    if(!entityList) {
        return false;
    }

    entityList.delete(entityID);

    if(entityList.size === 0) {
        this.entityTiles.delete(index);
    }

    return true;
}

Map2D.prototype.getEntityList = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.entityTiles.get(index);

    if(!entityList) {
        return null;
    }

    return entityList;
}

Map2D.prototype.getFirstEntity = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.entityTiles.get(index);

    if(!entityList) {
        return null;
    }

    const iterator = entityList.values();
    const firstEntity = iterator.next().value;
    
    return firstEntity;
}

Map2D.prototype.isTileOccupied = function(tileX, tileY) {
    const index = tileY * this.width + tileX;
    const isOccupied = this.entityTiles.has(index) && this.entityTiles.get(index).size > 0;

    return isOccupied;
}

Map2D.prototype.getAutoGeneratingLayers = function() {
    const layerIDs = new Set();

    for(const layerConfig of this.backgroundLayers) {
        const { id, autoGenerate } = layerConfig;

        if(autoGenerate) {
            layerIDs.add(id);
        }
    }

    for(const layerConfig of this.foregroundLayers) {
        const { id, autoGenerate } = layerConfig;

        if(autoGenerate) {
            layerIDs.add(id);
        }
    }

    for(const layerConfig of this.metaLayers) {
        const { id, autoGenerate } = layerConfig;

        if(autoGenerate) {
            layerIDs.add(id);
        }
    }

    return layerIDs;
}

Map2D.prototype.setLayerOpacity = function(layerID, opacity) {
    if(this.layers[layerID] === undefined || opacity === undefined) {
        return false;
    }

    opacity = clampValue(opacity, 1, 0);

    for(const layerConfig of this.backgroundLayers) {
        const { id } = layerConfig;

        if(id === layerID) {
            layerConfig.opacity = opacity;

            return true;
        }
    }

    for(const layerConfig of this.foregroundLayers) {
        const { id } = layerConfig;

        if(id === layerID) {
            layerConfig.opacity = opacity;

            return true;
        }
    }

    for(const layerConfig of this.metaLayers) {
        const { id } = layerConfig;

        if(id === layerID) {
            layerConfig.opacity = opacity;

            return true;
        }
    }

    return false;
} 

Map2D.prototype.resizeLayer = function(layerID, width, height, fill) {
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

Map2D.prototype.clearTile = function(layerID, tileX, tileY) {
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

Map2D.prototype.placeTile = function(data, layerID, tileX, tileY) {
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

    layer[index] = data;

    return true;
}

Map2D.prototype.isTileOutOfBounds = function(tileX, tileY) {
    return tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height;
}

Map2D.prototype.getTile = function(layerID, tileX, tileY) {
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

Map2D.prototype.removeEntity = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;

            this.removePointer(pointer, locationX, locationY);
        }
    }
}

Map2D.prototype.addEntity = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;

            this.setPointer(pointer, locationX, locationY);
        }
    }
}

Map2D.prototype.updateTiles = function(onUpdate) {
    for(let i = 0; i < this.height; i++) {
        const row = i * this.width;

        for(let j = 0; j < this.width; j++) {
            const index = row + j;

            onUpdate(index, j, i);
        }
    }
}