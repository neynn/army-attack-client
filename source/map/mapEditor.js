import { Logger } from "../logger.js";
import { clampValue, loopValue } from "../math/math.js";

export const MapEditor = function() {
    this.brush = null;
    this.config = {};
    this.brushSets = [];
    this.allSetElements = [];
    this.brushSetIndex = 0;
    this.brushSizeIndex = 0;
    this.brushModeIndex = 0;
    this.pageIndex = 0;
    this.activityStack = [];
}

MapEditor.MODE_DRAW = "DRAW";
MapEditor.MODE_ERASE = "ERASE";
MapEditor.MODE_FILL = "FILL";

MapEditor.prototype.scrollBrushSize = function(delta = 0) {    
    this.brushSizeIndex = clampValue(this.brushSizeIndex + delta, this.config.brushSizes.length - 1, 0);
}

MapEditor.prototype.getBrushSize = function() {
    return this.config.brushSizes[this.brushSizeIndex];
}

MapEditor.prototype.scrollBrushMode = function(delta = 0) {
    this.brushModeIndex = loopValue(this.brushModeIndex + delta, this.config.brushModes.length - 1, 0);
    this.reloadAll();
}

MapEditor.prototype.getBrushMode = function() {
    return this.config.brushModes[this.brushModeIndex];
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    this.brushSetIndex = loopValue(this.brushSetIndex + delta, this.brushSets.length - 1, 0);
    this.reloadAll();
}    

MapEditor.prototype.getBrushSet = function() {
    return this.brushSets[this.brushSetIndex];
}

MapEditor.prototype.scrollPage = function(delta = 0) {
    const maxSlots = this.config.interface.slots.length;
    const maxPagesNeeded = Math.ceil(this.allSetElements.length / maxSlots);

    if(maxPagesNeeded <= 0) {
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

        if(index > this.allSetElements.length - 1) {
            pageElements.push({
                "tileName": "",
                "tileID": 0
            });

            continue;
        }

        const tileName = this.allSetElements[index];
        const tileID = values[tileName];
        
        pageElements.push({
            "tileName": tileName,
            "tileID": tileID
        });
    }

    return pageElements;
}

MapEditor.prototype.reloadAll = function() {
    this.allSetElements = [];
    this.pageIndex = 0;
    this.brush = null;

    const brushMode = this.getBrushMode();

    if(brushMode === MapEditor.MODE_DRAW) {
        const brushSet = this.getBrushSet();

        if(!brushSet) {
            return;
        }

        const { values } = brushSet;

        for(const key in values) {
            this.allSetElements.push(key);
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

MapEditor.prototype.undo = function(gameContext) {
    if(this.activityStack.length === 0) {
        return false;
    }

    const { mapManager } = gameContext;
    const { mapID, mode, actions } = this.activityStack.pop();
    const gameMap = mapManager.getLoadedMap(mapID);

    if(!gameMap) {
        return false;
    }

    for(const { layerID, tileX, tileY, oldID, newID } of actions) {
        gameMap.placeTile(oldID, layerID, tileX, tileY);
    }

    return true;
}

MapEditor.prototype.swapFlag = function(gameContext, mapID, layerID) {
    const { mapManager } = gameContext;
    const cursorTile = gameContext.getMouseTile();
    const gameMap = mapManager.getLoadedMap(mapID);

    if(!gameMap) {
        return false;
    }

    const actionsTaken = [];
    const brushSize = this.getBrushSize();
    const startX = cursorTile.x - brushSize;
    const startY = cursorTile.y - brushSize;
    const endX = cursorTile.x + brushSize;
    const endY = cursorTile.y + brushSize;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const flag = gameMap.getTile(layerID, j, i);

            if(flag === null) {
                continue;
            }

            const nextFlag = flag === 0 ? 1 : 0;
            
            gameMap.placeTile(nextFlag, layerID, j, i);

            actionsTaken.push({
                "layerID": layerID,
                "tileX": j,
                "tileY": i,
                "oldID": flag,
                "newID": nextFlag
            });
        }
    }

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": mapID,
            "mode": MapEditor.MODE_DRAW,
            "actions": actionsTaken
        });
    }

    return true;
}

MapEditor.prototype.paint = function(gameContext, mapID, layerID) {
    const { mapManager } = gameContext;
    const cursorTile = gameContext.getMouseTile();
    const gameMap = mapManager.getLoadedMap(mapID);
    const brush = this.getBrush();

    if(!gameMap || !brush) {
        return;
    }

    const actionsTaken = [];
    const { tileID } = brush;
    const brushSize = this.getBrushSize();
    const startX = cursorTile.x - brushSize;
    const startY = cursorTile.y - brushSize;
    const endX = cursorTile.x + brushSize;
    const endY = cursorTile.y + brushSize;

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const oldTileID = gameMap.getTile(layerID, j, i);

            if(oldTileID === null || oldTileID === tileID) {
                continue;
            }

            gameMap.placeTile(tileID, layerID, j, i);

            actionsTaken.push({
                "layerID": layerID,
                "tileX": j,
                "tileY": i,
                "oldID": oldTileID,
                "newID": tileID
            });
        }
    }

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": mapID,
            "mode": MapEditor.MODE_DRAW,
            "actions": actionsTaken
        });
    }
}

MapEditor.prototype.resizeMap = function(gameMap, width, height) {
    const defaultSetup = this.config.defaultMapSetup;
    const { layers } = defaultSetup;

    for(const layerID in gameMap.layers) {
        const layerSetup = layers[layerID];

        if(layerSetup) {
            const { fill } = layerSetup;
            gameMap.resizeLayer(layerID, width, height, fill);
            continue;
        }

        gameMap.resizeLayer(layerID, width, height, 0);
    }

    gameMap.width = width;
    gameMap.height = height;

    return true;
}

MapEditor.prototype.getDefaultMapData = function() {
    return {
        "data": this.config.defaultMapSetup,
        "meta": this.config.defaultMapMeta,
        "success": true,
        "code": "DEFAULT"
    }
}