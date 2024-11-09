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
    this.tiles = [];
    this.entities = [];
    this.flags = {};
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

Map2D.prototype.getSurroundingTiles = function(directions) {
    const tiles = {};

    for(const directionID in directions) {
        const { x, y } = directions[directionID];
        const tile = this.getTile(x, y);
        
        tiles[directionID] = tile;
    }

    return tiles;
}

Map2D.prototype.getSurroundingLayerTiles = function(layerID, directions) {
    const tiles = {};

    for(const directionID in directions) {
        const { x, y } = directions[directionID];
        const tile = this.getLayerTile(layerID, x, y);
        
        tiles[directionID] = tile;
    }

    return tiles;
}

Map2D.prototype.getID = function() {
    return this.id;
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

Map2D.prototype.getLayerTile = function(layerID, tileX, tileY) {
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

Map2D.prototype.getTile = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;

    return this.tiles[index];
}

Map2D.prototype.getTileEntity = function(tileX, tileY) {
    if(this.isTileOutOfBounds(tileX, tileY)) {
        return null;
    }

    const index = tileY * this.width + tileX;
    const tile = this.tiles[index];
    
    if(!tile) {
        return null;
    }
    
    return tile.getFirstEntity();
}

Map2D.prototype.removePointers = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const tile = this.getTile(locationX, locationY);
            
            if(!tile) {
                console.warn(`Tile [${locationY}][${locationX}] does not exist! Continuing...`);
                continue;
            }

            tile.removeEntity(pointer);
        }
    }
}

Map2D.prototype.setPointers = function(tileX, tileY, rangeX, rangeY, pointer) {
    for(let i = 0; i < rangeY; i++) {
        const locationY = tileY + i;

        for(let j = 0; j < rangeX; j++) {
            const locationX = tileX + j;
            const tile = this.getTile(locationX, locationY);
            
            if(!tile) {
                console.warn(`Tile [${locationY}][${locationX}] does not exist! Continuing...`);
                continue;
            }

            tile.addEntity(pointer);
        }
    }
}

Map2D.prototype.updateTiles = function(onUpdate) {
    if(this.tiles.length === 0) {
        console.warn(`Tiles for map ${this.id} are not loaded!`);
        return;
    }

    for(let i = 0; i < this.height; i++) {
        const row = i * this.width;

        for(let j = 0; j < this.width; j++) {
            const index = row + j;
            const tile = this.tiles[index];

            onUpdate(tile, j, i, index);
        }
    }
}

Map2D.prototype.loadTiles = function(onLoad) {
    if(this.tiles.length !== 0) {
        console.warn(`Tiles for map ${this.id} are already loaded!`);
        return;
    }

    this.tiles = [];

    for(let i = 0; i < this.height; i++) {
        const row = i * this.width;

        for(let j = 0; j < this.width; j++) {
            const index = row + j;
            const tile = onLoad(this, j, i, index);

            this.tiles[index] = tile;
        }
    }
}

Map2D.prototype.clearTiles = function() {
    this.tiles = [];
}