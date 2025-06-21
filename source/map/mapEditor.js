import { loopValue } from "../math/math.js";
import { Scroller } from "../scroller.js";
import { Brush } from "./editor/brush.js";

export const MapEditor = function() {
    this.mapID = null;
    this.brush = new Brush();
    this.brushSets = new Scroller();
    this.brushSizes = new Scroller();
    this.modes = new Scroller([MapEditor.MODE.DRAW, MapEditor.MODE.AUTOTILE]);
    this.activityStack = [];
    this.hiddenSets = new Set();
    this.autoState = MapEditor.AUTOTILER_STATE.INACTIVE;
}

MapEditor.AUTOTILER_STATE = {
    INACTIVE: 0,
    ACTIVE: 1,
    ACTIVE_INVERTED: 2
};

MapEditor.MODE = {
    DRAW: 0,
    AUTOTILE: 1
};

MapEditor.MODE_NAME = {
    [MapEditor.MODE.DRAW]: "DRAW",
    [MapEditor.MODE.AUTOTILE]: "AUTOTILE"
};

MapEditor.prototype.toggleInversion = function() {
    switch(this.autoState) {
        case MapEditor.AUTOTILER_STATE.ACTIVE: {
            this.autoState = MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED;
            break;
        }
        case MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED: {
            this.autoState = MapEditor.AUTOTILER_STATE.ACTIVE;
            break;
        }
    }

    return this.autoState;
}

MapEditor.prototype.toggleAutotiling = function() {
    switch(this.autoState) {
        case MapEditor.AUTOTILER_STATE.INACTIVE: {
            this.autoState = MapEditor.AUTOTILER_STATE.ACTIVE;
            break;
        }
        default: {
            this.autoState = MapEditor.AUTOTILER_STATE.INACTIVE;
            break;
        }
    }

    return this.autoState;
}

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

//inversion is an option, not a static feature!
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
    //TODO: add autotiler mode, not based on tiles autotiler.
    //TODO: add 3 brush mode variations: 1. regular, 2. autotiler 3. autocorrecter
    const autotiler = tileManager.getAutotilerByTile(id);

    this.brush.paint(x, y, (tileX, tileY, brushID, brushName) => {
        const tileID = worldMap.getTile(layerID, tileX, tileY);

        if(tileID !== null && tileID !== brushID) {
            worldMap.placeTile(brushID, layerID, tileX, tileY);

            this.onPaint(gameContext, worldMap, brushID, tileX, tileY);
        }

        switch(this.autoState) {
            case MapEditor.AUTOTILER_STATE.INACTIVE: {
                actionsTaken.push({
                    "layerID": layerID,
                    "tileX": tileX,
                    "tileY": tileY,
                    "oldID": tileID
                });

                break;
            }
            case MapEditor.AUTOTILER_STATE.ACTIVE: {
                if(autotiler) {
                    const startX = tileX - 1;
                    const startY = tileY - 1;
                    const endX = tileX + 1;
                    const endY = tileY + 1;

                    for(let i = startY; i <= endY; i++) {
                        for(let j = startX; j <= endX; j++) {
                            worldMap.applyAutotiler(autotiler, j, i, layerID, false);
                        }
                    }
                }

                break;
            }
            case MapEditor.AUTOTILER_STATE.ACTIVE_INVERTED: {
                if(autotiler) {
                    const startX = tileX - 1;
                    const startY = tileY - 1;
                    const endX = tileX + 1;
                    const endY = tileY + 1;

                    for(let i = startY; i <= endY; i++) {
                        for(let j = startX; j <= endX; j++) {
                            worldMap.applyAutotiler(autotiler, j, i, layerID, true);
                        }
                    }
                }

                break;
            }
        }
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