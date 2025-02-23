import { ArmyMap } from "../../game/init/armyMap.js";
import { Logger } from "../logger.js";
import { clampValue, loopValue } from "../math/math.js";

export const MapEditor = function() {
    this.brush = null;
    this.config = {};
    this.brushSets = [];
    this.allSetElements = [];
    this.brushSetIndex = 0;
    this.brushSizeIndex = 0;
    this.pageIndex = 0;
    this.activityStack = [];
    this.modes = [MapEditor.MODE.DRAW, MapEditor.MODE.ERASE, MapEditor.MODE.FILL];
    this.modeIndex = 0;
    this.isAutotiling = false;
}

MapEditor.MODE = {
    "DRAW": "DRAW",
    "ERASE": "ERASE",
    "FILL": "FILL"
};

MapEditor.prototype.toggleAutotiling = function() {
    this.isAutotiling = !this.isAutotiling;
}

MapEditor.prototype.scrollBrushSize = function(delta = 0) {    
    this.brushSizeIndex = clampValue(this.brushSizeIndex + delta, this.config.brushSizes.length - 1, 0);
}

MapEditor.prototype.getBrushSize = function() {
    return this.config.brushSizes[this.brushSizeIndex];
}

MapEditor.prototype.scrollBrushMode = function(delta = 0) {
    this.modeIndex = loopValue(this.modeIndex + delta, this.modes.length - 1, 0);
    this.reloadAll();
}

MapEditor.prototype.getBrushMode = function() {
    return this.modes[this.modeIndex];
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
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }
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

    if(brushMode === MapEditor.MODE.DRAW) {
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
        return;
    }

    this.config = config;
}

MapEditor.prototype.loadBrushSets = function(invertedTileMeta) {
    for(const setID in invertedTileMeta) {
        if(this.config.hiddenSets[setID]) {
            continue;
        }

        const brushSet = {};
        const set = invertedTileMeta[setID];

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
        return;
    }

    const { world } = gameContext;
    const { mapManager } = world;
    const { mapID, mode, actions } = this.activityStack.pop();
    const gameMap = mapManager.getLoadedMap(mapID);

    if(!gameMap) {
        return;
    }

    for(const { layerID, tileX, tileY, oldID, newID } of actions) {
        gameMap.placeTile(oldID, layerID, tileX, tileY);
    }
}

MapEditor.prototype.paint = function(gameContext, mapID, layerID) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const { meta } = tileManager;
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
    const tileMeta = meta.getMeta(tileID);

    for(let i = startY; i <= endY; i++) {
        for(let j = startX; j <= endX; j++) {
            const oldTileID = gameMap.getTile(layerID, j, i);

            if(oldTileID === null || oldTileID === tileID) {
                continue;
            }

            gameMap.placeTile(tileID, layerID, j, i);

            if(tileMeta) {
                const { defaultType } = tileMeta;

                if(defaultType) {
                    gameMap.placeTile(defaultType, ArmyMap.LAYER.TYPE, j, i);
                }
            }

            if(this.isAutotiling) {
                gameMap.repaint(gameContext, j, i, layerID);
            }

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
            "mode": MapEditor.MODE.DRAW,
            "actions": actionsTaken
        });
    }
}

MapEditor.prototype.resizeMap = function(worldMap, width, height) {
    const defaultSetup = this.config.default.layers;

    for(const [layerID, layer] of worldMap.layers) {
        const layerSetup = defaultSetup[layerID];
        const fill = layerSetup ? layerSetup.fill : 0;

        worldMap.resizeLayer(layerID, width, height, fill);
    }

    worldMap.setWidth(width);
    worldMap.setHeight(height);
}

MapEditor.prototype.incrementTypeIndex = function(gameContext, types, mapID, layerID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(mapID);

    if(!worldMap) {
        return;
    }

    const { x, y } = gameContext.getMouseTile();
    const tileTypeIDs = [];

    for(const typeID of Object.keys(types)) {
        const type = types[typeID];

        tileTypeIDs.push(type.id);
    }

    const currentID = worldMap.getTile(layerID, x, y);
    const currentIndex = tileTypeIDs.indexOf(currentID);
    const nextIndex = loopValue(currentIndex + 1, tileTypeIDs.length - 1, 0);
    const nextID = tileTypeIDs[nextIndex];

    worldMap.placeTile(nextID, layerID, x, y);
}

MapEditor.prototype.getDefaultMapData = function() {
    return this.config.default;
}