import { ArmyMap } from "../../game/init/armyMap.js";
import { loopValue } from "../math/math.js";
import { Scroller } from "../scroller.js";

export const MapEditor = function() {
    this.brush = null;
    this.allSetElements = [];

    this.brushSets = new Scroller();
    this.brushSet = null;

    this.brushSizes = new Scroller();
    this.brushSize = 0;

    this.brushModes = new Scroller([MapEditor.MODE.DRAW, MapEditor.MODE.AUTOTILE]);
    this.brushMode = MapEditor.MODE.DRAW;

    this.pageIndex = 0;
    this.activityStack = [];
    this.isAutotiling = false;
    this.hiddenSets = new Set();
    this.slots = [];
}

MapEditor.MODE = {
    "DRAW": "DRAW",
    "AUTOTILE": "AUTOTILE"
};

MapEditor.prototype.toggleAutotiling = function() {
    this.isAutotiling = !this.isAutotiling;

    return this.isAutotiling;
}

MapEditor.prototype.scrollBrushSize = function(delta = 0) {
    const brushSize = this.brushSizes.scroll(delta);

    if(brushSize !== null) {
        this.brushSize = brushSize;
    }
}

MapEditor.prototype.scrollBrushMode = function(delta = 0) {
    const brushMode = this.brushModes.loop(delta);

    if(brushMode) {
        this.brushMode = brushMode;
    }

    this.reloadAll();
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    const brushSet = this.brushSets.loop(delta);

    if(brushSet) {
        this.brushSet = brushSet;
    }

    this.reloadAll();
}    

MapEditor.prototype.scrollPage = function(delta = 0) {
    const maxPagesNeeded = Math.ceil(this.allSetElements.length / this.slots.length);

    if(maxPagesNeeded <= 0) {
        this.pageIndex = 0;
    } else {
        this.pageIndex = loopValue(this.pageIndex + delta, maxPagesNeeded - 1, 0);
    }
}

MapEditor.prototype.routePage = function() {
    switch(this.brushMode) {
        case MapEditor.MODE.DRAW: return this.getDrawPage();
        case MapEditor.MODE.AUTOTILE: return this.getAutotilePage();
        default: return this.getAutotilePage();
    }
}

MapEditor.prototype.getAutotilePage = function() {
    const maxSlots = this.slots.length;
    const pageElements = []; 

    for(let i = 0; i < maxSlots; i++) {
        pageElements.push({
            "tileName": "NONE",
            "tileID": 0
        });
    }

    return pageElements;
}

MapEditor.prototype.getDrawPage = function() {
    const pageElements = []; 

    if(!this.brushSet) {
        for(let i = 0; i < this.slots.length; i++) {
            pageElements.push({
                "tileName": "NONE",
                "tileID": 0
            });
        }

        return pageElements;
    }

    const { values } = this.brushSet;

    for(let i = 0; i < this.slots.length; i++) {
        const index = this.slots.length * this.pageIndex + i;

        if(index > this.allSetElements.length - 1) {
            pageElements.push({
                "tileName": "NONE",
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

    switch(this.brushMode) {
        case MapEditor.MODE.DRAW: {
            if(!this.brushSet) {
                return;
            }

            const { values } = this.brushSet;

            for(const key in values) {
                this.allSetElements.push(key);
            }

            break;
        }
        case MapEditor.MODE.AUTOTILE: {
            break;
        }
    }
}

MapEditor.prototype.loadBrushSets = function(invertedTileMeta) {
    const sets = [];

    for(const setID in invertedTileMeta) {
        if(this.hiddenSets.has(setID)) {
            continue;
        }

        const brushSet = {};
        const set = invertedTileMeta[setID];

        for(const tileID in set) {
            brushSet[tileID] = set[tileID];
        }

        sets.push({
            "id": setID,
            "values": brushSet
        });
    }

    this.brushSets.setValues(sets);
    this.scrollBrushSet(0);
    this.reloadAll();
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

    if(!gameMap || !this.brush) {
        return;
    }

    const actionsTaken = [];
    const { tileID } = this.brush;
    const startX = cursorTile.x - this.brushSize;
    const startY = cursorTile.y - this.brushSize;
    const endX = cursorTile.x + this.brushSize;
    const endY = cursorTile.y + this.brushSize;
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

MapEditor.prototype.resizeMap = function(worldMap, width, height, layers) {
    for(const [layerID, layer] of worldMap.layers) {
        const layerConfig = layers[layerID];

        if(layerConfig) {
            const fill = layerConfig.fill;

            worldMap.resizeLayer(layerID, width, height, fill);
        } else {
            worldMap.resizeLayer(layerID, width, height, 0);
        }
    }

    worldMap.setWidth(width);
    worldMap.setHeight(height);
}

MapEditor.prototype.incrementTypeIndex = function(gameContext, mapID, layerID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const types = gameContext.tileTypes;
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