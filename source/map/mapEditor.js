import { clampValue, loopValue } from "../math/math.js";
import { response } from "../response.js";

export const MapEditor = function() {
    this.config = {};
    this.brushSizes = [MapEditor.BRUSH_SIZE_SMALL, MapEditor.BRUSH_SIZE_MEDIUM, MapEditor.BRUSH_SIZE_LARGE, MapEditor.BRUSH_SIZE_EXTRALARGE, MapEditor.BRUSH_SIZE_COLOSSAL];
    this.currentBrushSizeIndex = 0;
    this.brushModes = [MapEditor.MODE_TYPE_TILE, MapEditor.MODE_TYPE_PATTERN, MapEditor.MODE_TYPE_ANIMATION];
    this.currentBrushModeIndex = 0;
    this.brushSize = 0;
    this.selectedBrush = null;
    this.tileSetKeys = [];
    this.currentSetIndex = 0;
    this.allPageElements = [];
    this.currentPageIndex = 0;
}

MapEditor.MODE_TYPE_TILE = "TILE";
MapEditor.MODE_TYPE_PATTERN = "PATTERN";
MapEditor.MODE_TYPE_ANIMATION = "ANIMATION";
MapEditor.BRUSH_SIZE_SMALL = 0;
MapEditor.BRUSH_SIZE_MEDIUM = 1;
MapEditor.BRUSH_SIZE_LARGE = 2;
MapEditor.BRUSH_SIZE_EXTRALARGE = 3;
MapEditor.BRUSH_SIZE_COLOSSAL = 4;

MapEditor.prototype.loadConfig = function(config) {
    if(config === undefined) {
        return response(false, "Config cannot be undefined!", "MapEditor.prototype.loadConfig", null, null);
    }

    this.config = config;

    return response(true, "Config has been loaded!", "MapEditor.prototype.loadConfig", null, null);
}

MapEditor.prototype.loadTileSetKeys = function(tileSets) {
    if(!this.config) {
        return response(false, "Config is not loaded!", "MapEditor.prototype.loadTileSetKeys", null, null);
    }

    if(!tileSets) {
        return response(false, "TileSets cannot be undefined!", "MapEditor.prototype.loadTileSetKeys", null, null);
    }

    const keys = [];
    
    for(const key in tileSets) {
        if(this.config.hiddenSets[key] === undefined) {
            keys.push(key);
        }
    }

    this.tileSetKeys = keys;
    this.reloadPageElements(tileSets);

    return response(true, "TileSetKeys have been set!", "MapEditor.prototype.loadTileSetKeys", null, null);
}

MapEditor.prototype.getSelectedBrush = function() {
    return this.selectedBrush;
}

MapEditor.prototype.setSelectedBrush = function(brush) {
    if(brush === undefined) {
        return response(false, "Brush cannot be undefined!", "MapEditor.prototype.setSelectedBrush", null, null);
    }

    this.selectedBrush = brush;

    return response(true, "Brush has been set!", "MapEditor.prototype.setSelectedBrush", null, null);
}

MapEditor.prototype.getPageElements = function(pageSlots) {
    const tileSetID = this.getCurrentSetID();
    const brushModeID = this.getBrushModeID();
    const pageElements = []; 

    for(let i = 0; i < pageSlots; i++) {
        const index = pageSlots * this.currentPageIndex + i;

        if(index > this.allPageElements.length - 1) {
            pageElements.push(null);
            continue;
        }

        const tileAnimationID = this.allPageElements[index];

        pageElements.push([tileSetID, tileAnimationID, brushModeID]);
    }

    return pageElements;
}

MapEditor.prototype.reloadPageElements = function(tileSets) {
    this.allPageElements = [];
    this.currentPageIndex = 0;

    const MODE_TILE = 0;
    const MODE_PATTERN = 1;
    const MODE_ANIMATION = 2;

    const brushModeID = this.getBrushModeID();
    const tileSetID = this.getCurrentSetID();
    const tileSet = tileSets[tileSetID];
    
    this.selectedBrush = undefined;
    
    if(!tileSet || !brushModeID) {
        return response(false, "BrushMode or TileSet is undefined!", "MapEditor.prototype.reloadPageElements", null, {brushModeID, tileSetID});
    }

    switch(this.currentBrushModeIndex) {
        case MODE_TILE: {
            for(const key in tileSet.frames) {
                this.allPageElements.push(key);
            }
    
            for(const key in tileSet.patterns) {
                this.allPageElements.push(key);
            }

            break;
        }
        case MODE_PATTERN: {
            for(const key in tileSet.patterns) {
                this.allPageElements.push(key);
            }

            break;
        }
        case MODE_ANIMATION: {
            for(const key in tileSet.animations) {
                this.allPageElements.push(key);
            }

            break;
        }
    }
}

MapEditor.prototype.getCurrentSetID = function() {
    const currentSetKey = this.tileSetKeys[this.currentSetIndex];

    if(!currentSetKey) {
        response(false, "TileSetKey does not exist!", "MapEditor.prototype.getCurrentSetID", null, null);
        return null;
    }

    return currentSetKey;
}

MapEditor.prototype.getMaxBrushSize = function() {
    return this.brushSizes.length - 1;
}

MapEditor.prototype.getBrushModeID = function() {
    if(!this.brushModes[this.currentBrushModeIndex]) {
        console.warn(`currentBrushModeIndex cannot be undefined! Returning null...`);
        return null;
    }

    return this.brushModes[this.currentBrushModeIndex];
}

MapEditor.prototype.setBrushSize = function(brushSizeIndex) {
    if(!brushSizeIndex > this.brushSizes.length - 1) {
        return response(false, "Brush size does not exist!", "MapEditor.prototype.setBrushSize", null, {brushSizeIndex});
    }

    this.brushSize = this.brushSizes[brushSizeIndex];

    return response(true, "Brush size has been set!", "MapEditor.prototype.setBrushSize", null, {brushSizeIndex});
}

MapEditor.prototype.scrollBrushSize = function(delta) {
    if(delta === undefined) {
        return false;
    }
    
    this.brushSize = clampValue(this.brushSize + delta, this.brushSizes.length - 1, 0);

    return true;
}

MapEditor.prototype.scrollPage = function(pageSlots, value) {
    const maxPagesNeeded = Math.ceil(this.allPageElements.length / pageSlots);

    if(maxPagesNeeded === 0) {
        this.currentPageIndex = 0;
        return false;
    }

    if(value === undefined) {
        return false;
    }

    this.currentPageIndex = loopValue(this.currentPageIndex + value, maxPagesNeeded - 1, 0);

    return true;
}

MapEditor.prototype.scrollBrushMode = function(value) {
    if(value === undefined) {
        return false;
    }

    this.currentBrushModeIndex = loopValue(this.currentBrushModeIndex + value, this.brushModes.length - 1, 0);
    this.currentPageIndex = 0;

    return true;
}

MapEditor.prototype.scrollCurrentSet = function(value) {
    if(value === undefined) {
        return false;
    }

    this.currentSetIndex = loopValue(this.currentSetIndex + value, this.tileSetKeys.length - 1, 0);
    this.currentPageIndex = 0;

    return true;
}

MapEditor.prototype.swapFlag = function(gameContext, mapID, layerID) {
    const { mapLoader } = gameContext;
    const cursorTile = gameContext.getViewportTilePosition();
    const gameMap = mapLoader.getLoadedMap(mapID);

    if(!gameMap) {
        return false;
    }

    const startX = cursorTile.x - this.brushSize;
    const startY = cursorTile.y - this.brushSize;
    const endX = cursorTile.x + this.brushSize;
    const endY = cursorTile.y + this.brushSize;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const flag = gameMap.getLayerTile(layerID, j, i);
            gameMap.placeTile(!flag, layerID, j, i);
        }
    }

    return true;
}

MapEditor.prototype.paint = function(gameContext, mapID, layerID) {
    const { mapLoader } = gameContext;
    const cursorTile = gameContext.getViewportTilePosition();
    const gameMap = mapLoader.getLoadedMap(mapID);
    const brush = this.getSelectedBrush();

    if(!gameMap || brush === undefined) {
        return false;
    }

    const startX = cursorTile.x - this.brushSize;
    const startY = cursorTile.y - this.brushSize;
    const endX = cursorTile.x + this.brushSize;
    const endY = cursorTile.y + this.brushSize;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            if(brush === null) {
                gameMap.placeTile(null, layerID, j, i);
            } else {
                const [tileSetID, frameID, brushModeID] = brush;
                gameMap.placeTile([tileSetID, frameID], layerID, j, i);
            }
        }
    }
    
    return true;
    /*
    const tileSet = spriteManager.tileSprites[tileSetID];
    if(brushModeID === MapEditor.MODE_TYPE_PATTERN) {
        const pattern = tileSet.patterns[frameID];

        for(let i = 0; i < pattern.length; i++) {
            for(let j = 0; j < pattern[i].length; j++) {
                const patternFrameID = pattern[i][j];
                gameMap.placeTile([tileSetID, patternFrameID], currentLayer, cursorTile.x + j, cursorTile.y + i);
            }
        }

        return;
    }
    */
}

MapEditor.prototype.getBrushSize = function() {
    return this.brushSize;
}