import { loopValue } from "../math/math.js";
import { Scroller } from "../scroller.js";
import { Brush } from "./editor/brush.js";

export const MapEditor = function() {
    this.brush = new Brush();
    this.allAutotilers = [];
    this.currentSetTiles = [];

    this.brushSet = null;
    this.brushSets = new Scroller();
    this.brushSizes = new Scroller();
    this.brushModes = new Scroller([MapEditor.MODE.DRAW, MapEditor.MODE.AUTOTILE]);
    this.brushMode = MapEditor.MODE.DRAW;

    this.pageIndex = 0;
    this.activityStack = [];
    this.isAutotiling = false;
    this.hiddenSets = new Set();
    this.slots = [];
}

MapEditor.MODE = {
    DRAW: 0,
    AUTOTILE: 1
};

MapEditor.MODE_NAME = {
    [MapEditor.MODE.DRAW]: "DRAW",
    [MapEditor.MODE.AUTOTILE]: "AUTOTILE"
};

MapEditor.prototype.toggleAutotiling = function() {
    this.isAutotiling = !this.isAutotiling;

    return this.isAutotiling;
}

MapEditor.prototype.scrollBrushSize = function(delta = 0) {
    const brushSize = this.brushSizes.scroll(delta);

    if(brushSize !== null) {
        this.brush.setSize(brushSize);
    }
}

MapEditor.prototype.scrollBrushMode = function(delta = 0) {
    const brushMode = this.brushModes.loop(delta);

    if(brushMode !== null) {
        this.brushMode = brushMode;
    }

    this.reloadAll();
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    const brushSet = this.brushSets.loop(delta);

    if(brushSet !== null) {
        this.brushSet = brushSet;
    }

    this.reloadAll();
}    

MapEditor.prototype.getModeElements = function() {
    switch(this.brushMode) {
        case MapEditor.MODE.DRAW: return this.currentSetTiles;
        case MapEditor.MODE.AUTOTILE: return this.allAutotilers;
        default: return [];
    }
}   

MapEditor.prototype.scrollPage = function(delta = 0) {
    const modeElements = this.getModeElements();
    const maxPagesNeeded = Math.ceil(modeElements.length / this.slots.length);

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
        pageElements.push(this.brush.createPalletElement(Brush.ID.INVALID, "NONE"));
    }

    return pageElements;
}

MapEditor.prototype.getDrawPage = function() {
    const pageElements = []; 
    const modeElements = this.getModeElements();

    if(!this.brushSet) {
        for(let i = 0; i < this.slots.length; i++) {
            pageElements.push(this.brush.createPalletElement(Brush.ID.INVALID, "NONE"));
        }

        return pageElements;
    }

    const { values } = this.brushSet;

    for(let i = 0; i < this.slots.length; i++) {
        const index = this.slots.length * this.pageIndex + i;

        if(index > modeElements.length - 1) {
            pageElements.push(this.brush.createPalletElement(Brush.ID.INVALID, "NONE"));

            continue;
        }

        const tileName = modeElements[index];
        const tileID = values[tileName];
        
        pageElements.push(this.brush.createPalletElement(tileID, tileName));
    }

    return pageElements;
}

MapEditor.prototype.reloadAll = function() {
    this.pageIndex = 0;
    this.brush.reset();

    switch(this.brushMode) {
        case MapEditor.MODE.DRAW: {
            this.currentSetTiles = [];

            if(!this.brushSet) {
                return;
            }

            const { values } = this.brushSet;

            for(const key in values) {
                this.currentSetTiles.push(key);
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

    for(let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const { layerID, tileX, tileY, oldID } = action;

        gameMap.placeTile(oldID, layerID, tileX, tileY);
    }
}

MapEditor.prototype.paint = function(gameContext, mapID, layerID, onPaint) {
    if(typeof onPaint !== "function") {
        return;
    }

    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(mapID);

    if(!worldMap) {
        return;
    }

    const actionsTaken = [];
    const { x, y } = gameContext.getMouseTile();
    const { id } = this.brush;
    const autotiler = tileManager.getAutotilerByTile(id);

    this.brush.paint(x, y, (j, i, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, j, i);

        if(tileID !== null && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, j, i);

            onPaint(worldMap, brushID, j, i);

            if(!this.isAutotiling) {
                actionsTaken.push({
                    "layerID": layerID,
                    "tileX": j,
                    "tileY": i,
                    "oldID": tileID
                });
            }
        }

        if(this.isAutotiling) {
            worldMap.updateAutotiler(autotiler, j, i, layerID);
        }
    });

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": mapID,
            "mode": this.brushMode,
            "actions": actionsTaken
        });
    }
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