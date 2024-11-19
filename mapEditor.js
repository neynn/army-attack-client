import { Logger } from "./source/logger.js";
import { clampValue, loopValue } from "./source/math/math.js";

export const MapEditor = function() {
    this.config = {};
    this.brushSets = [];
    this.brushSetIndex = 0;
    this.brushSet = null;
    this.brushSizeIndex = 0;
    this.brushSize = null;
    this.brushModeIndex = 0;
    this.brushMode = null;
    this.brush = null;
    this.allPageElements = [];
    this.pageIndex = 0;
}

MapEditor.prototype.scrollBrushSize = function(delta = 0) {    
    this.brushSizeIndex = clampValue(this.brushSizeIndex + delta, this.config.brushSizes.length - 1, 0);
    this.brushSize = this.config.brushSizes[this.brushSizeIndex];
}

MapEditor.prototype.getBrushSize = function() {
    if(this.brushSize === null) {
        this.brushSize = this.config.brushSizes[this.brushSizeIndex];
    }

    return this.brushSize;
}

MapEditor.prototype.scrollBrushMode = function(delta = 0) {
    this.brushModeIndex = loopValue(this.brushModeIndex + delta, this.config.brushModes.length - 1, 0);
    this.brushMode = this.config.brushModes[this.brushModeIndex];
    this.reloadAll();
}

MapEditor.prototype.getBrushMode = function() {
    if(this.brushMode === null) {
        this.brushMode = this.config.brushModes[this.brushModeIndex];
    }

    return this.brushMode;
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    this.brushSetIndex = loopValue(this.brushSetIndex + delta, this.brushSets.length - 1, 0);
    this.brushSet = this.brushSets[this.brushSetIndex];
    this.reloadAll();
}    

MapEditor.prototype.getBrushSet = function() {
    if(this.brushSet === null) {
        this.brushSet = this.brushSets[this.brushSetIndex];
    }

    return this.brushSet;
}

MapEditor.prototype.scrollPage = function(delta = 0) {
    const maxSlots = this.config.interface.slots.length;
    const maxPagesNeeded = Math.ceil(this.allPageElements.length / maxSlots);

    if(maxPagesNeeded === 0) {
        this.pageIndex = 0;

        return;
    }

    this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
}

MapEditor.prototype.getPage = function() {
    const maxSlots = this.config.interface.slots.length;
    const brushSet = this.getBrushSet();
    const pageElements = []; 

    if(!brushSet) {
        for(let i = 0; i < maxSlots; i++) {
            pageElements.push({
                "tileName": "",
                "tileID": 0
            });
        }

        return pageElements;
    }

    const { values } = brushSet;

    for(let i = 0; i < maxSlots; i++) {
        const index = maxSlots * this.pageIndex + i;

        if(index > this.allPageElements.length - 1) {
            pageElements.push({
                "tileName": "",
                "tileID": 0
            });

            continue;
        }

        const tileName = this.allPageElements[index];
        const tileID = values[tileName];
        
        pageElements.push({
            "tileName": tileName,
            "tileID": tileID
        });
    }

    return pageElements;
}

MapEditor.prototype.reloadAll = function() {
    this.allPageElements = [];
    this.pageIndex = 0;
    this.brush = null;

    const brushMode = this.getBrushMode();

    if(brushMode === "DRAW") {
        const brushSet = this.getBrushSet();

        if(!brushSet) {
            return;
        }

        const { values } = brushSet;

        for(const key in values) {
            this.allPageElements.push(key);
        }
    }
}

MapEditor.prototype.loadConfig = function(config) {
    if(config === undefined) {
        Logger.log(false, "Config cannot be undefined!", "MapEditor.prototype.loadConfig", null);

        return false;
    }

    this.config = config;

    return true;
}

MapEditor.prototype.loadBrushSets = function(tileMeta) {
    for(const setID in tileMeta.inversion) {
        if(this.config.hiddenSets[setID]) {
            continue;
        }

        const set = tileMeta.inversion[setID];
        const brushSet = {};

        for(const tileID in set) {
            brushSet[tileID] = set[tileID];
        }

        this.brushSets.push({
            "id": setID,
            "values": brushSet
        });
    }

    this.reloadAll();
}

MapEditor.prototype.getBrush = function() {
    return this.brush;
}

MapEditor.prototype.setBrush = function(brush = null) {
    this.brush = brush;
}

MapEditor.prototype.swapFlag = function(gameContext, mapID, layerID) {
    const { mapLoader } = gameContext;
    const cursorTile = gameContext.getMouseTile();
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
            const flag = gameMap.getTile(layerID, j, i);
            const nextFlag = flag === 0 ? 1 : 0;
            
            gameMap.placeTile(nextFlag, layerID, j, i);
        }
    }

    return true;
}

MapEditor.prototype.paint = function(gameContext, mapID, layerID) {
    const { mapLoader } = gameContext;
    const cursorTile = gameContext.getMouseTile();
    const gameMap = mapLoader.getLoadedMap(mapID);
    const brush = this.getBrush();

    if(!gameMap || !brush) {
        return;
    }

    const { tileID } = brush;
    const startX = cursorTile.x - this.brushSize;
    const startY = cursorTile.y - this.brushSize;
    const endX = cursorTile.x + this.brushSize;
    const endY = cursorTile.y + this.brushSize;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            gameMap.placeTile(tileID, layerID, j, i);
        }
    }
}