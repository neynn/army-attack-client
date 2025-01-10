import { clampValue } from "../math/math.js";

export const WorldMap = function(id) {
    this.id = id;
    this.width = 0;
    this.height = 0;
    this.meta = {};
    this.layers = {};
    this.entities = new Map();
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

WorldMap.prototype.addPointer = function(entityID, tileX, tileY) {
    const entityList = this.getEntityList(tileX, tileY);
    
    if(!entityList) {
        const index = tileY * this.width + tileX;

        this.entities.set(index, [entityID]);
        return;
    }

    entityList.push(entityID);
}

WorldMap.prototype.removePointer = function(entityID, tileX, tileY) {
    const entityList = this.getEntityList(tileX, tileY);

    if(!entityList) {
        return;
    }

    for(let i = 0; i < entityList.length; i++) {
        const entry = entityList[i];

        if(entry === entityID) {
            entityList.splice(i, 1);
            break;
        }
    }

    if(entityList.length === 0) {
        const index = tileY * this.width + tileX;

        this.entities.delete(index);
    }
}

WorldMap.prototype.getEntityList = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;
    const entityList = this.entities.get(index);

    if(!entityList) {
        return null;
    }

    return entityList;
}

WorldMap.prototype.getEntities = function(tileX, tileY) {
    const entityList = this.getEntityList(tileX, tileY);

    if(!entityList) {
        return [];
    }

    return entityList;
}

WorldMap.prototype.getTopEntity = function(tileX, tileY) {
    const entityList = this.getEntityList(tileX, tileY);

    if(!entityList || entityList.length === 0) {
        return null;
    }

    return entityList[entityList.length - 1];
}

WorldMap.prototype.getBottomEntity = function(tileX, tileY) {
    const entityList = this.getEntityList(tileX, tileY);

    if(!entityList || entityList.length === 0) {
        return null;
    }

    return entityList[0];
}

WorldMap.prototype.isTileOccupied = function(tileX, tileY) {
    const index = tileY * this.width + tileX;
    const entityList = this.entities.get(index);

    if(!entityList) {
        return false;
    }

    return entityList.length > 0;
}

WorldMap.prototype.setLayerOpacity = function(layerID, opacity) {
    if(this.layers[layerID] === undefined || opacity === undefined) {
        return;
    }

    const clampedOpacity = clampValue(opacity, 1, 0);
    const layerConfig = this.meta.layerConfig[layerID];

    layerConfig.opacity = clampedOpacity;
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

WorldMap.prototype.removeEntity = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;

            this.removePointer(pointer, locationX, locationY);
        }
    }
}

WorldMap.prototype.addEntity = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;

            this.addPointer(pointer, locationX, locationY);
        }
    }
}

WorldMap.prototype.updateTiles = function(onUpdate) {
    for(let i = 0; i < this.height; i++) {
        const row = i * this.width;

        for(let j = 0; j < this.width; j++) {
            const index = row + j;

            onUpdate(index, j, i);
        }
    }
}