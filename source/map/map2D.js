import { clampValue } from "../math/math.js";

export const Map2D = function(id, config) {
    this.id = id;
    this.music = null;
    this.width = 0;
    this.height = 0;
    this.layerOpacity = {};
    this.layers = {};
    this.backgroundLayers = [];
    this.foregroundLayers = [];
    this.metaLayers = [];
    this.tiles = [];
    this.entities = [];
    this.flags = {};

    this.initialize(config);
}

Map2D.prototype.initialize = function(config) {
    const { music, width, height, layerOpacity, layers, tiles, entities, flags, backgroundLayers, foregroundLayers, metaLayers } = config;

    if(music) {
        this.music = music;
    }

    if(width) {
        this.width = width;
    }

    if(height) {
        this.height = height;
    }

    if(layerOpacity) {
        this.layerOpacity = layerOpacity;
    }

    if(layers) {
        this.layers = layers;
    }
    
    if(tiles) {
        this.tiles = tiles;
    }

    if(entities) {
        this.entities = entities;
    }

    if(flags) {
        this.flags = flags;
    }

    if(backgroundLayers) {
        this.backgroundLayers = backgroundLayers;
    }

    if(foregroundLayers) {
        this.foregroundLayers = foregroundLayers;
    }

    if(metaLayers) {
        this.metaLayers = metaLayers;
    }
}

Map2D.prototype.setLayerOpacity = function(layerID, opacity) {
    if(this.layers[layerID] === undefined || opacity === undefined) {
        return false;
    }

    opacity = clampValue(opacity, 1, 0);

    this.layerOpacity[layerID] = opacity;

    return true;
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

Map2D.prototype.generateEmptyLayer = function(layerID, fillID) {
    const layer = new Array(this.height * this.width);

    for(let i = 0; i < this.height; i++) {
        const row = i * this.width;

        for(let j = 0; j < this.width; j++) {
            const index = row + j;

            layer[index] = fillID;
        }
    }

    this.layers[layerID] = layer;
}

Map2D.prototype.resizeLayer = function(layerID, width, height, fill) {
    const oldLayer = this.layers[layerID];

    if(!oldLayer) {
        return false;
    }

    const layerSize = width * height;
    const newLayer = new Array(layerSize);
    
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