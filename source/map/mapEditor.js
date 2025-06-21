import { loopValue } from "../math/math.js";
import { Scroller } from "../scroller.js";
import { EditorAutotiler } from "./editor/autotiler.js";
import { Brush } from "./editor/brush.js";

export const MapEditor = function() {
    this.mapID = null;
    this.brush = new Brush();
    this.brushSets = new Scroller();
    this.brushSizes = new Scroller();
    this.modes = new Scroller([MapEditor.MODE.DRAW, MapEditor.MODE.AUTOTILE]);
    this.activityStack = [];
    this.hiddenSets = new Set();
    this.autotiler = new EditorAutotiler();
}

MapEditor.MODE = {
    DRAW: 0,
    AUTOTILE: 1
};

MapEditor.MODE_NAME = {
    [MapEditor.MODE.DRAW]: "DRAW",
    [MapEditor.MODE.AUTOTILE]: "AUTOTILE"
};

MapEditor.prototype.scrollBrushSize = function(delta = 0) {
    const brushSize = this.brushSizes.scroll(delta);

    if(brushSize !== null) {
        this.brush.setSize(brushSize);
    }
}

MapEditor.prototype.scrollMode = function(delta = 0) {
    const mode = this.modes.loop(delta);

    if(mode !== null) {
        this.reloadBrush();
    }
}

MapEditor.prototype.scrollBrushSet = function(delta) {
    const brushSet = this.brushSets.loop(delta);

    if(brushSet !== null) {
        this.reloadBrush();
    }
}

MapEditor.prototype.reloadBrush = function() {
    const brushMode = this.modes.getValue();

    switch(brushMode) {
        case MapEditor.MODE.DRAW: {
            const pallet = this.brushSets.getValue();

            if(pallet) {
                const { values } = pallet;
        
                this.brush.loadPallet(values);
            } else {
                this.brush.clearPallet();
            }
            break;
        }
        case MapEditor.MODE.AUTOTILE: {
            this.brush.clearPallet();
            break;
        }
    }

    this.brush.reset();
}

MapEditor.prototype.initBrushSets = function(invertedTileMeta) {
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
    this.reloadBrush();
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

MapEditor.prototype.onPaint = function(gameContext, worldMap, tileID, tileX, tileY) {}

MapEditor.prototype.paint = function(gameContext, layerID) {
    const { world, tileManager } = gameContext;
    const { mapManager } = world;
    const worldMap = mapManager.getLoadedMap(this.mapID);

    if(!worldMap) {
        return;
    }

    const actionsTaken = [];
    const { x, y } = gameContext.getMouseTile();
    const { id } = this.brush;
    const autotiler = tileManager.getAutotilerByTile(id);

    this.brush.paint(x, y, (tileX, tileY, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID !== null && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, tileX, tileY);

            this.onPaint(gameContext, worldMap, brushID, tileX, tileY);

            actionsTaken.push({
                "layerID": layerID,
                "tileX": tileX,
                "tileY": tileY,
                "oldID": tileID
            });
        }

        this.autotiler.run(autotiler, worldMap, tileX, tileY, layerID);
    });

    if(actionsTaken.length !== 0) {
        this.activityStack.push({
            "mapID": this.mapID,
            "mode": this.modes.getValue(),
            "actions": actionsTaken
        });
    }
}

MapEditor.prototype.incrementTypeIndex = function(gameContext, layerID) {
    const { world } = gameContext;
    const { mapManager } = world;
    const types = gameContext.tileTypes;
    const worldMap = mapManager.getLoadedMap(this.mapID);

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